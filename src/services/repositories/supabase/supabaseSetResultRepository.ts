import { DuplicateSetResultError, type SetResult } from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { ISetResultRepository } from '../types';
import { mapSetResultRow, mapSetResultToRow } from './mappers';

export class SupabaseSetResultRepository implements ISetResultRepository {
  private readonly client = getSupabaseClient();

  async listByTeam(teamId: string): Promise<SetResult[]> {
    const { data, error } = await this.client
      .from('set_results')
      .select('*')
      .eq('team_id', teamId)
      .order('set_number', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map(mapSetResultRow);
  }

  async create(result: SetResult): Promise<SetResult> {
    const existing = await this.listByTeam(result.teamId);
    const duplicate = existing.some((row) => row.setNumber === result.setNumber);
    if (duplicate) {
      throw new DuplicateSetResultError(result.teamId, result.setNumber);
    }

    const row = mapSetResultToRow(result);
    const { data, error } = await this.client
      .from('set_results')
      .insert(row)
      .select('*')
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        throw new DuplicateSetResultError(result.teamId, result.setNumber);
      }
      throw new Error(error?.message ?? 'set_results の保存に失敗しました');
    }
    return mapSetResultRow(data);
  }

  async resetAll(): Promise<void> {
    const { error } = await this.client
      .from('set_results')
      .delete()
      .gte('set_number', 0);
    if (error) {
      throw new Error(error.message);
    }
  }
}
