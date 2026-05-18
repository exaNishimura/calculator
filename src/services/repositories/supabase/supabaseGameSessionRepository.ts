import type { EventId, GameSession } from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { IGameSessionRepository } from '../types';
import { mapGameSessionRow, mapGameSessionToRow } from './mappers';

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

export class SupabaseGameSessionRepository implements IGameSessionRepository {
  private readonly client = getSupabaseClient();

  async get(): Promise<GameSession> {
    const { data, error } = await this.client
      .from('game_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return this.save(createDefaultSession());
    }
    return mapGameSessionRow(data);
  }

  async save(session: GameSession): Promise<GameSession> {
    const row = {
      ...mapGameSessionToRow(session),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await this.client
      .from('game_sessions')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'game_sessions の保存に失敗しました');
    }
    return mapGameSessionRow(data);
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
    const { error } = await this.client
      .from('game_sessions')
      .delete()
      .gte('session_set', 0);
    if (error) {
      throw new Error(error.message);
    }
  }
}
