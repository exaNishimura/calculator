import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService, timingSafeEqual } from '@/services/authService';
import { createLocalRepositories } from '@/services/repositories';
import { createMemoryStorage } from '@/services/repositories/storage';
import { seedDemoTeams } from '@/services/repositories/seed';

describe('AuthService', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('validates known team codes', async () => {
    const repos = createLocalRepositories(storage);
    await seedDemoTeams(repos.teams);
    const auth = new AuthService(repos.teams);

    const team = await auth.validateTeamCode('shogai');
    expect(team?.teamCode).toBe('shogai');
    expect(team?.teamName).toBe('渉外活動委員会');
    expect(await auth.validateTeamCode('unknown')).toBeNull();
  });

  it('validates admin passcode from env', () => {
    const auth = new AuthService(createLocalRepositories(storage).teams);
    expect(auth.validateAdminPasscode('test-admin-pass')).toBe(true);
    expect(auth.validateAdminPasscode('wrong')).toBe(false);
  });
});

describe('timingSafeEqual', () => {
  it('returns false for different lengths', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });
});
