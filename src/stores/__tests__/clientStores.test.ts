import { beforeEach, describe, expect, it } from 'vitest';
import { repositories, seedDemoTeams } from '@/services/repositories';
import { syncService } from '@/services/instances';
import { useGameStore } from '../gameStore';
import { useTeamDraftStore } from '../teamDraftStore';

describe('client stores', () => {
  beforeEach(async () => {
    localStorage.clear();
    await repositories.resetAll();
    useGameStore.setState({ teams: [], session: null, loading: false });
    useTeamDraftStore.getState().clear();
  });

  it('hydrates teams and session', async () => {
    await seedDemoTeams(repositories.teams);
    await repositories.gameSession.assignEvent(1, 'evt_01');

    await useGameStore.getState().hydrate();
    const state = useGameStore.getState();

    expect(state.teams).toHaveLength(6);
    expect(state.session?.activeEventId).toBe('evt_01');
  });

  it('loads team draft and restores backup when investing', async () => {
    await seedDemoTeams(repositories.teams);

    const team = (await repositories.teams.getByCode('shogai'))!;
    syncService.backupDraft('shogai', {
      team,
      investments: [{ id: 'd1', sector: 'it', amount: 20_000 }],
    });

    const loaded = await useTeamDraftStore.getState().loadTeam('shogai');
    expect(loaded?.teamCode).toBe('shogai');
    expect(useTeamDraftStore.getState().investments).toHaveLength(1);
  });

  it('clears stale draft from previous SET when loading next SET investing screen', async () => {
    await seedDemoTeams(repositories.teams);

    const set1 = (await repositories.teams.getByCode('shogai'))!;
    syncService.backupDraft('shogai', {
      team: set1,
      investments: [{ id: 'old', sector: 'food', amount: 100_000 }],
    });

    await repositories.teams.upsert({
      ...set1,
      currentSet: 2,
      currentAsset: 600_000,
      status: 'investing',
      pendingInvestments: null,
      investmentSubmittedAt: null,
    });

    await useTeamDraftStore.getState().loadTeam('shogai');
    expect(useTeamDraftStore.getState().team?.currentSet).toBe(2);
    expect(useTeamDraftStore.getState().investments).toEqual([]);

    const draft = syncService.restoreDraft('shogai');
    expect(draft?.team.currentSet).toBe(2);
    expect(draft?.investments).toEqual([]);
  });
});
