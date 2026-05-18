import { beforeEach, describe, expect, it } from 'vitest';
import type { InvestmentLine } from '@/types/domain';
import {
  EventCalculationService,
  GameProgressService,
  summarizePreparation,
} from '@/services';
import {
  createLocalRepositories,
  seedDemoTeams,
} from '@/services/repositories';
import { createMemoryStorage } from '@/services/repositories/storage';
import { SyncService } from '@/services/syncService';

/**
 * Phase 1 受入フロー（tasks 9.1）:
 * 運営イベント確定 → チーム投資 → 投資完了 → イベント結果確定 → 次 SET
 */
describe('Phase 1 E2E flow (services)', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('runs admin event assign → team invest → confirm → SET2', async () => {
    const repos = createLocalRepositories(storage);
    const sync = new SyncService(repos);
    const progress = new GameProgressService(
      repos,
      new EventCalculationService(),
    );

    await seedDemoTeams(repos.teams);

    await sync.assignEvent(1, 'evt_03');
    const sessionAfterAssign = await repos.gameSession.get();
    expect(sessionAfterAssign.activeEventId).toBe('evt_03');
    expect(sessionAfterAssign.activeEventSetNumber).toBe(1);

    let team = (await repos.teams.getByCode('shogai'))!;
    team = await sync.persistTeam({
      ...team,
      currentAsset: 500_000,
    });

    const investments: InvestmentLine[] = [
      { id: 'inv-e2e-1', sector: 'food', amount: 100_000 },
    ];

    team = await progress.completeInvestmentSubmission(team.id, investments);
    expect(team.status).toBe('investment_submitted');
    expect(team.pendingInvestments).toEqual(investments);

    const prepAfterSubmit = summarizePreparation(await repos.teams.listAll());
    expect(prepAfterSubmit.investmentSubmittedCount).toBeGreaterThanOrEqual(1);

    team = await progress.proceedToEvent(team.id);
    expect(team.status).toBe('waiting_event');

    const confirmed = await progress.confirmSetResult(team.id, {
      setNumber: 1,
      startingAsset: 500_000,
      investments,
      selectedEventId: 'evt_03',
      borrowedInSet: false,
    });

    expect(confirmed.team.currentSet).toBe(2);
    expect(confirmed.team.status).toBe('investing');
    expect(confirmed.team.pendingInvestments).toBeNull();
    expect(confirmed.setResult.setNumber).toBe(1);
    expect(confirmed.setResult.resultAsset).toBeGreaterThan(0);

    const history = await repos.setResults.listByTeam(team.id);
    expect(history).toHaveLength(1);

    const prepSet2 = summarizePreparation(await repos.teams.listAll());
    expect(prepSet2.currentSet).toBe(2);
    expect(prepSet2.investmentSubmittedCount).toBe(0);

    const calc = new EventCalculationService();
    const previewSet2 = calc.preview(
      confirmed.team,
      [],
      sessionAfterAssign,
    );
    expect(previewSet2.ok).toBe(false);
  });

  it('allows event assign after investment submit (late admin publish)', async () => {
    const repos = createLocalRepositories(storage);
    const sync = new SyncService(repos);
    const progress = new GameProgressService(
      repos,
      new EventCalculationService(),
    );

    await seedDemoTeams(repos.teams);
    let team = (await repos.teams.getByCode('business'))!;
    team = await sync.persistTeam({ ...team, currentAsset: 300_000 });

    const investments: InvestmentLine[] = [
      { id: 'inv-late', sector: 'it', amount: 50_000 },
    ];

    team = await progress.completeInvestmentSubmission(team.id, investments);
    team = await progress.proceedToEvent(team.id);

    await sync.assignEvent(1, 'evt_01');

    const confirmed = await progress.confirmSetResult(team.id, {
      setNumber: 1,
      startingAsset: 300_000,
      investments,
      selectedEventId: 'evt_01',
      borrowedInSet: false,
    });

    expect(confirmed.team.currentSet).toBe(2);
    expect(confirmed.setResult.selectedEvent).toBe('evt_01');
  });
});
