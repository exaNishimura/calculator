import type { LocalRepositories } from '../types';
import { SupabaseGameSessionRepository } from './supabaseGameSessionRepository';
import { SupabaseSetResultRepository } from './supabaseSetResultRepository';
import { SupabaseTeamRepository } from './supabaseTeamRepository';

export function createSupabaseRepositories(): LocalRepositories {
  const gameSession = new SupabaseGameSessionRepository();
  const teams = new SupabaseTeamRepository();
  const setResults = new SupabaseSetResultRepository();

  return {
    gameSession,
    teams,
    setResults,
    async resetAll() {
      await setResults.resetAll();
      await teams.resetAll();
      await gameSession.reset();
    },
  };
}

export { SupabaseGameSessionRepository } from './supabaseGameSessionRepository';
export { SupabaseSetResultRepository } from './supabaseSetResultRepository';
export { SupabaseTeamRepository } from './supabaseTeamRepository';
