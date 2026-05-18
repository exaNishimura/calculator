import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS, createMemoryStorage } from '@/services/repositories/storage';
import {
  createLocalRepositories,
  seedDemoTeams,
} from '@/services/repositories';
import { SyncService } from '@/services/syncService';

/**
 * Phase 2（tasks 10.3 / 10.4）:
 * Realtime は postgres_changes → SyncService.notify と同じ経路。
 * 2 端末相当: 運営 SyncService が assignEvent → チーム側 subscribe が session キーを受信。
 */
describe('Phase 2 multi-client sync (notify path)', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('admin event assign propagates to team subscriber without reload', async () => {
    const repos = createLocalRepositories(storage);
    const adminSync = new SyncService(repos);
    const teamSync = new SyncService(repos);

    await seedDemoTeams(repos.teams);

    const receivedKeys: string[] = [];
    const stop = teamSync.subscribe(({ key }) => {
      receivedKeys.push(key);
    });

    await adminSync.assignEvent(1, 'evt_03');

    expect(receivedKeys).toContain(STORAGE_KEYS.session);
    const session = await repos.gameSession.get();
    expect(session.activeEventId).toBe('evt_03');
    expect(session.activeEventSetNumber).toBe(1);

    stop();
  });

  it('team persist propagates to admin dashboard subscriber', async () => {
    const repos = createLocalRepositories(storage);
    const teamSync = new SyncService(repos);
    const adminSync = new SyncService(repos);

    const teams = await seedDemoTeams(repos.teams);
    const teamKeys: string[] = [];
    const stop = adminSync.subscribe(({ key }) => {
      if (key === STORAGE_KEYS.teams) {
        teamKeys.push(key);
      }
    });

    await teamSync.persistTeam({
      ...teams[0]!,
      currentAsset: 420_000,
    });

    expect(teamKeys).toHaveLength(1);
    const updated = await repos.teams.getByCode(teams[0]!.teamCode);
    expect(updated?.currentAsset).toBe(420_000);

    stop();
  });
});

describe('SyncService.initRealtime', () => {
  const tableHandlers = new Map<string, () => void>();
  const removeChannel = vi.fn();

  const mockChannel = {
    on: vi.fn(
      (
        _event: string,
        filter: { table?: string },
        callback: () => void,
      ) => {
        if (filter.table) {
          tableHandlers.set(filter.table, callback);
        }
        return mockChannel;
      },
    ),
    subscribe: vi.fn(function subscribe(this: typeof mockChannel) {
      return mockChannel;
    }),
  };

  beforeEach(() => {
    tableHandlers.clear();
    vi.resetModules();
    vi.doMock('@/config/dataSource', () => ({
      resolveDataSource: () => 'supabase',
    }));
    vi.doMock('@/lib/supabaseClient', () => ({
      getSupabaseClient: () => ({
        channel: vi.fn(() => mockChannel),
        removeChannel,
      }),
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/config/dataSource');
    vi.doUnmock('@/lib/supabaseClient');
    vi.resetModules();
  });

  it('subscribes to game_sessions, teams, set_results and notifies on change', async () => {
    const { SyncService: SyncServiceMocked } = await import(
      '@/services/syncService'
    );
    const { createLocalRepositories } = await import(
      '@/services/repositories'
    );
    const storage = createMemoryStorage();
    const repos = createLocalRepositories(storage);
    const sync = new SyncServiceMocked(repos);
    const listener = vi.fn();
    const stopSubscribe = sync.subscribe(listener);
    const stopRealtime = sync.initRealtime();

    expect(mockChannel.on).toHaveBeenCalledTimes(3);
    expect(mockChannel.subscribe).toHaveBeenCalled();

    tableHandlers.get('game_sessions')?.();
    tableHandlers.get('teams')?.();
    tableHandlers.get('set_results')?.();

    expect(listener).toHaveBeenCalledWith({ key: STORAGE_KEYS.session });
    expect(listener).toHaveBeenCalledWith({ key: STORAGE_KEYS.teams });
    expect(listener).toHaveBeenCalledWith({ key: STORAGE_KEYS.setResults });

    stopRealtime();
    expect(removeChannel).toHaveBeenCalled();
    stopSubscribe();
  });
});
