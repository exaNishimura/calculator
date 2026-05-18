import { beforeEach, describe, expect, it } from 'vitest';
import { BORROW_ASSET_THRESHOLD } from '@/constants';
import {
  EventCalculationService,
  GameProgressService,
  addInvestment,
  executeBorrow,
  isEditable,
  previewSetCalculation,
} from '@/services';
import {
  createLocalRepositories,
  seedDemoTeams,
} from '@/services/repositories';
import { createMemoryStorage } from '@/services/repositories/storage';

/**
 * Phase 1 スモーク（tasks 9.2）— 要件 2.8 / 3.2 / 4.10
 * UI 側は TeamEntryPage.test / EventResultsPage.test でカバー済み
 */
describe('Phase 1 smoke — investment completion lock (Req 2.8)', () => {
  const storage = createMemoryStorage();

  beforeEach(async () => {
    storage.clear();
    await seedDemoTeams(createLocalRepositories(storage).teams);
  });

  it('blocks further investment edits after submission', async () => {
    const repos = createLocalRepositories(storage);
    const team = (await repos.teams.getByCode('shogai'))!;
    const withAsset = await repos.teams.upsert({
      ...team,
      currentAsset: 200_000,
    });
    const progress = new GameProgressService(
      repos,
      new EventCalculationService(),
    );

    const submitted = await progress.completeInvestmentSubmission(
      withAsset.id,
      [{ id: 'inv-1', sector: 'food', amount: 50_000 }],
    );

    expect(isEditable(submitted.status)).toBe(false);
    expect(submitted.pendingInvestments).toHaveLength(1);

    const addResult = addInvestment(
      { team: submitted, investments: submitted.pendingInvestments ?? [] },
      { sector: 'it', amount: 10_000 },
    );
    expect(addResult.ok).toBe(false);
  });
});

describe('Phase 1 smoke — event calc without assign (Req 4.10)', () => {
  const storage = createMemoryStorage();

  beforeEach(async () => {
    storage.clear();
    await seedDemoTeams(createLocalRepositories(storage).teams);
  });

  it('rejects preview and confirm when event is not assigned', async () => {
    const repos = createLocalRepositories(storage);
    const team = await repos.teams.upsert({
      ...(await repos.teams.getByCode('shogai'))!,
      currentAsset: 200_000,
      status: 'waiting_event',
      pendingInvestments: [
        { id: 'inv-1', sector: 'agriculture', amount: 50_000 },
      ],
    });
    const session = await repos.gameSession.get();
    const investments = team.pendingInvestments ?? [];

    const preview = previewSetCalculation(team, investments, session);
    expect(preview.ok).toBe(false);
    if (!preview.ok) {
      expect(preview.error.code).toBe('EVENT_NOT_ASSIGNED');
    }

    const progress = new GameProgressService(
      repos,
      new EventCalculationService(),
    );
    await expect(
      progress.confirmSetResult(team.id, {
        setNumber: 1,
        startingAsset: team.currentAsset,
        investments,
        selectedEventId: 'evt_01',
        borrowedInSet: false,
      }),
    ).rejects.toMatchObject({ code: 'EVENT_NOT_ASSIGNED' });
  });
});

describe('Phase 1 smoke — borrow rejection (Req 3.2)', () => {
  it('rejects borrow when current asset is at or above threshold', () => {
    const result = executeBorrow({
      id: 't',
      teamName: 'T',
      teamCode: 't',
      currentSet: 1,
      currentAsset: BORROW_ASSET_THRESHOLD,
      totalDebt: 0,
      netAsset: BORROW_ASSET_THRESHOLD,
      status: 'investing',
      pendingInvestments: null,
      investmentSubmittedAt: null,
      borrowedInCurrentSet: false,
      loanApplicationAmount: null,
      loanAppliedAt: null,
      updatedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BORROW_NOT_ALLOWED');
    }
  });

  it('allows borrow only below threshold', () => {
    const result = executeBorrow({
      id: 't',
      teamName: 'T',
      teamCode: 't',
      currentSet: 1,
      currentAsset: BORROW_ASSET_THRESHOLD - 1,
      totalDebt: 0,
      netAsset: BORROW_ASSET_THRESHOLD - 1,
      status: 'investing',
      pendingInvestments: null,
      investmentSubmittedAt: null,
      borrowedInCurrentSet: false,
      loanApplicationAmount: null,
      loanAppliedAt: null,
      updatedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(true);
  });
});
