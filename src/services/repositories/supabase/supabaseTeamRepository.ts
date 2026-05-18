import type { Team } from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { ITeamRepository } from '../types';
import { mapTeamRow, mapTeamToInsert } from './mappers';

export class SupabaseTeamRepository implements ITeamRepository {
  private readonly client = getSupabaseClient();

  async getByCode(teamCode: string): Promise<Team | null> {
    const normalized = teamCode.trim().toLowerCase();
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('team_code', normalized)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data ? mapTeamRow(data) : null;
  }

  async getById(id: string): Promise<Team | null> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data ? mapTeamRow(data) : null;
  }

  async listAll(): Promise<Team[]> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .order('team_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map(mapTeamRow);
  }

  async upsert(team: Team): Promise<Team> {
    const row = mapTeamToInsert(team);
    const { data, error } = await this.client
      .from('teams')
      .upsert(row, { onConflict: 'team_code' })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'teams の保存に失敗しました');
    }
    return mapTeamRow(data);
  }

  async resetAll(): Promise<void> {
    const { error } = await this.client.from('teams').delete().gte('current_set', 0);
    if (error) {
      throw new Error(error.message);
    }
  }
}
