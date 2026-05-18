import type { RealtimeChannel } from '@supabase/supabase-js';
import { resolveDataSource } from '@/config/dataSource';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { FACILITATOR_TEAMS } from '@/constants/teams';
import type { EventId, GameSession, SetResult, Team } from '@/types/domain';
import { SEED_VERSION, seedDemoTeams } from './repositories/seed';
import {
  STORAGE_KEYS,
  readJson,
  writeJson,
  browserStorage,
} from './repositories/storage';
import type { LocalRepositories } from './repositories/types';
import type { TeamDraft } from './types';

export const SYNC_EVENT = 'game02:storage-updated';
const DRAFT_KEY_PREFIX = 'game02:draft:';

function draftKey(teamCode: string): string {
  return `${DRAFT_KEY_PREFIX}${teamCode.trim().toLowerCase()}`;
}

export type StorageSyncDetail = { key: string };
type StorageSyncListener = (detail: StorageSyncDetail) => void;

const WATCHED_KEYS = new Set<string>([
  STORAGE_KEYS.session,
  STORAGE_KEYS.teams,
  STORAGE_KEYS.setResults,
]);

export class SyncService {
  private readonly listeners = new Set<StorageSyncListener>();
  private realtimeChannel: RealtimeChannel | null = null;

  constructor(private readonly repos: LocalRepositories) {}

  /** Supabase Realtime → 既存の storage イベント購読と同じ notify 経路 */
  initRealtime(): () => void {
    if (resolveDataSource() !== 'supabase' || typeof window === 'undefined') {
      return () => undefined;
    }

    const client = getSupabaseClient();
    this.realtimeChannel = client
      .channel('game02-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions' },
        () => {
          this.notify(STORAGE_KEYS.session);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          this.notify(STORAGE_KEYS.teams);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'set_results' },
        () => {
          this.notify(STORAGE_KEYS.setResults);
        },
      )
      .subscribe();

    return () => {
      if (this.realtimeChannel) {
        void client.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
    };
  }

  notify(key: string): void {
    const detail = { key };
    this.listeners.forEach((listener) => listener(detail));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<StorageSyncDetail>(SYNC_EVENT, { detail }),
      );
    }
  }

  subscribe(listener: StorageSyncListener): () => void {
    this.listeners.add(listener);

    const onStorage = (event: StorageEvent) => {
      if (event.key && WATCHED_KEYS.has(event.key)) {
        listener({ key: event.key });
      }
    };

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<StorageSyncDetail>).detail;
      if (detail?.key && WATCHED_KEYS.has(detail.key)) {
        listener(detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      window.addEventListener(SYNC_EVENT, onCustom);
    }

    return () => {
      this.listeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(SYNC_EVENT, onCustom);
      }
    };
  }

  subscribeTeams(onUpdate: (team: Team) => void): () => void {
    return this.subscribe(({ key }) => {
      if (key !== STORAGE_KEYS.teams) {
        return;
      }
      void this.repos.teams.listAll().then((teams) => {
        teams.forEach(onUpdate);
      });
    });
  }

  subscribeSetResults(onInsert: (row: SetResult) => void): () => void {
    const knownIds = new Set<string>();

    const emitNew = () => {
      const rows =
        readJson<SetResult[]>(browserStorage, STORAGE_KEYS.setResults) ?? [];
      for (const row of rows) {
        if (!knownIds.has(row.id)) {
          knownIds.add(row.id);
          onInsert(row);
        }
      }
    };

    return this.subscribe(({ key }) => {
      if (key === STORAGE_KEYS.setResults) {
        emitNew();
      }
    });
  }

  backupDraft(teamCode: string, draft: TeamDraft): void {
    writeJson(browserStorage, draftKey(teamCode), draft);
  }

  restoreDraft(teamCode: string): TeamDraft | null {
    return readJson<TeamDraft>(browserStorage, draftKey(teamCode));
  }

  clearDraft(teamCode: string): void {
    browserStorage.removeItem(draftKey(teamCode));
  }

  async persistTeam(team: Team): Promise<Team> {
    const saved = await this.repos.teams.upsert(team);
    this.notify(STORAGE_KEYS.teams);
    return saved;
  }

  async assignEvent(setNumber: number, eventId: EventId): Promise<GameSession> {
    const session = await this.repos.gameSession.assignEvent(setNumber, eventId);
    this.notify(STORAGE_KEYS.session);
    return session;
  }

  async saveSession(session: GameSession): Promise<GameSession> {
    const saved = await this.repos.gameSession.save(session);
    this.notify(STORAGE_KEYS.session);
    return saved;
  }

  async persistSetResult(result: SetResult): Promise<SetResult> {
    const saved = await this.repos.setResults.create(result);
    this.notify(STORAGE_KEYS.setResults);
    return saved;
  }

  async resetGame(seedVersionKey: string): Promise<void> {
    await this.repos.resetAll();
    await seedDemoTeams(this.repos.teams);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(seedVersionKey, SEED_VERSION);
    }
    for (const entry of FACILITATOR_TEAMS) {
      this.clearDraft(entry.teamCode);
    }
    this.notify(STORAGE_KEYS.session);
    this.notify(STORAGE_KEYS.teams);
    this.notify(STORAGE_KEYS.setResults);
  }
}
