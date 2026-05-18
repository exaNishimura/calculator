import type { EventId, GameSession } from '@/types/domain';
import {
  STORAGE_KEYS,
  readJson,
  writeJson,
  type StorageAdapter,
} from './storage';
import type { IGameSessionRepository } from './types';

function createDefaultSession(): GameSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    sessionSet: 1,
    activeEventId: null,
    activeEventSetNumber: null,
    updatedAt: now,
  };
}

export class LocalGameSessionRepository implements IGameSessionRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async get(): Promise<GameSession> {
    const session = readJson<GameSession>(this.storage, STORAGE_KEYS.session);
    if (!session) {
      const initial = createDefaultSession();
      writeJson(this.storage, STORAGE_KEYS.session, initial);
      return initial;
    }
    return session;
  }

  async save(session: GameSession): Promise<GameSession> {
    const next: GameSession = {
      ...session,
      updatedAt: new Date().toISOString(),
    };
    writeJson(this.storage, STORAGE_KEYS.session, next);
    return next;
  }

  async assignEvent(setNumber: number, eventId: EventId): Promise<GameSession> {
    const current = await this.get();
    return this.save({
      ...current,
      sessionSet: setNumber,
      activeEventId: eventId,
      activeEventSetNumber: setNumber,
    });
  }

  async reset(): Promise<void> {
    this.storage.removeItem(STORAGE_KEYS.session);
  }
}
