import { beforeEach, describe, expect, it } from 'vitest';
import type { SetResult, Team } from '@/types/domain';
import { createLocalRepositories } from '../index';
import { createMemoryStorage } from '../storage';
import { seedDemoTeams } from '../seed';

describe('GameSessionRepository', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('returns default session when empty', async () => {
    const { gameSession } = createLocalRepositories(storage);
    const session = await gameSession.get();
    expect(session.sessionSet).toBe(1);
    expect(session.activeEventId).toBeNull();
    expect(session.activeEventSetNumber).toBeNull();
  });

  it('persists active event assignment', async () => {
    const { gameSession } = createLocalRepositories(storage);
    const saved = await gameSession.assignEvent(1, 'evt_03');
    expect(saved.activeEventId).toBe('evt_03');
    expect(saved.activeEventSetNumber).toBe(1);

    const loaded = await gameSession.get();
    expect(loaded.activeEventId).toBe('evt_03');
  });
});

describe('TeamRepository', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('seeds demo teams and finds by code', async () => {
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);

    const team = await repos.teams.getByCode('shogai');
    expect(team).not.toBeNull();
    expect(team?.teamName).toBe('渉外活動委員会');
    expect(team?.status).toBe('investing');
    expect(team?.netAsset).toBe(team!.currentAsset - team!.totalDebt);
  });

  it('rejects unknown team code', async () => {
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);
    expect(await repos.teams.getByCode('unknown')).toBeNull();
  });

  it('upserts team with synced net asset', async () => {
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);
    const team = (await repos.teams.getByCode('shogai')) as Team;

    const updated = await repos.teams.upsert({
      ...team,
      currentAsset: 400_000,
      totalDebt: 100_000,
      pendingInvestments: [{ id: '1', sector: 'agriculture', amount: 50_000 }],
      investmentSubmittedAt: new Date().toISOString(),
      status: 'investment_submitted',
    });

    expect(updated.netAsset).toBe(300_000);
    const loaded = await repos.teams.getById(team.id);
    expect(loaded?.pendingInvestments).toHaveLength(1);
    expect(loaded?.status).toBe('investment_submitted');
  });

  it('lists all teams', async () => {
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);
    const teams = await repos.teams.listAll();
    expect(teams).toHaveLength(6);
  });

  it('resetAll clears teams', async () => {
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);
    await repos.teams.resetAll();
    expect(await repos.teams.listAll()).toHaveLength(0);
  });
});

describe('SetResultRepository', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('creates and lists set results by team', async () => {
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);
    const team = (await repos.teams.getByCode('shogai')) as Team;

    const result: SetResult = {
      id: 'result-1',
      teamId: team.id,
      setNumber: 1,
      startingAsset: 500_000,
      investments: [{ id: '1', sector: 'agriculture', amount: 50_000 }],
      selectedEvent: 'evt_03',
      resultAsset: 540_000,
      borrowedAmount: 0,
      debtAdded: 0,
      completedAt: new Date().toISOString(),
    };

    await repos.setResults.create(result);
    const list = await repos.setResults.listByTeam(team.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.setNumber).toBe(1);
  });

  it('prevents duplicate set_number per team', async () => {
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);
    const team = (await repos.teams.getByCode('business')) as Team;

    const base: SetResult = {
      id: 'r1',
      teamId: team.id,
      setNumber: 1,
      startingAsset: 500_000,
      investments: [],
      selectedEvent: 'evt_01',
      resultAsset: 500_000,
      borrowedAmount: 0,
      debtAdded: 0,
      completedAt: new Date().toISOString(),
    };

    await repos.setResults.create(base);
    await expect(
      repos.setResults.create({ ...base, id: 'r2' }),
    ).rejects.toThrow(/already exists/i);
  });
});

describe('resetAll', () => {
  it('clears session, teams, and set results', async () => {
    const storage = createMemoryStorage();
    const repos = createLocalRepositories(storage);
    seedDemoTeams(repos.teams);
    await repos.gameSession.assignEvent(1, 'evt_01');

    const team = (await repos.teams.getByCode('shogai')) as Team;
    await repos.setResults.create({
      id: 'x',
      teamId: team.id,
      setNumber: 1,
      startingAsset: 100,
      investments: [],
      selectedEvent: 'evt_01',
      resultAsset: 100,
      borrowedAmount: 0,
      debtAdded: 0,
      completedAt: new Date().toISOString(),
    });

    await repos.resetAll();

    expect((await repos.gameSession.get()).activeEventId).toBeNull();
    expect(await repos.teams.listAll()).toHaveLength(0);
    expect(await repos.setResults.listByTeam(team.id)).toHaveLength(0);
  });
});
