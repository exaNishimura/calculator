import { resolveDataSource } from '@/config/dataSource';
import { LocalGameSessionRepository } from './gameSessionRepository';
import { LocalSetResultRepository } from './setResultRepository';
import { createSupabaseRepositories } from './supabase';
import { browserStorage, type StorageAdapter } from './storage';
import { LocalTeamRepository } from './teamRepository';
import type { LocalRepositories } from './types';

export function createLocalRepositories(
  storage: StorageAdapter = browserStorage,
): LocalRepositories {
  const gameSession = new LocalGameSessionRepository(storage);
  const teams = new LocalTeamRepository(storage);
  const setResults = new LocalSetResultRepository(storage);

  return {
    gameSession,
    teams,
    setResults,
    async resetAll() {
      await Promise.all([
        gameSession.reset(),
        teams.resetAll(),
        setResults.resetAll(),
      ]);
    },
  };
}

export function createRepositories(storage?: StorageAdapter): LocalRepositories {
  if (resolveDataSource() === 'supabase') {
    return createSupabaseRepositories();
  }
  return createLocalRepositories(storage);
}

export const repositories = createRepositories();
