import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Team } from '@/types/domain';
import { createLocalRepositories } from '@/services/repositories';
import { STORAGE_KEYS, createMemoryStorage } from '@/services/repositories/storage';
import { SyncService } from '@/services/syncService';
import { seedDemoTeams } from '@/services/repositories/seed';

describe('SyncService', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('notifies listeners and persists team updates', async () => {
    const repos = createLocalRepositories(storage);
    const sync = new SyncService(repos);
    const listener = vi.fn();
    const unsubscribe = sync.subscribe(listener);

    const teams = await seedDemoTeams(repos.teams);
    const updated = await sync.persistTeam({
      ...teams[0],
      currentAsset: 450_000,
    });

    expect(updated.currentAsset).toBe(450_000);
    expect(listener).toHaveBeenCalledWith({ key: STORAGE_KEYS.teams });
    unsubscribe();
  });

  it('backs up and restores team draft', async () => {
    const repos = createLocalRepositories(storage);
    const sync = new SyncService(repos);
    const teams = await seedDemoTeams(repos.teams);
    const team = teams[0] as Team;
    const draft = {
      team,
      investments: [{ id: '1', sector: 'food' as const, amount: 10_000 }],
    };

    sync.backupDraft('shogai', draft);
    expect(sync.restoreDraft('shogai')?.investments).toHaveLength(1);
    sync.clearDraft('shogai');
    expect(sync.restoreDraft('shogai')).toBeNull();
  });

  it('resets game to seeded initial state', async () => {
    const repos = createLocalRepositories(storage);
    const sync = new SyncService(repos);
    const teams = await seedDemoTeams(repos.teams);
    await repos.teams.upsert({
      ...teams[0]!,
      currentAsset: 1_000_000,
    });
    await repos.gameSession.assignEvent(1, 'evt_01');

    await sync.resetGame('game02:seedVersion');

    const team = await repos.teams.getByCode(teams[0]!.teamCode);
    const session = await repos.gameSession.get();
    expect(team?.currentAsset).toBe(0);
    expect(session.activeEventId).toBeNull();
    expect(sync.restoreDraft(teams[0]!.teamCode)).toBeNull();
  });

  it('assigns event and notifies session key', async () => {
    const repos = createLocalRepositories(storage);
    const sync = new SyncService(repos);
    const listener = vi.fn();
    const unsubscribe = sync.subscribe(listener);

    await sync.assignEvent(1, 'evt_05');
    expect(listener).toHaveBeenCalledWith({ key: STORAGE_KEYS.session });
    unsubscribe();
  });
});
