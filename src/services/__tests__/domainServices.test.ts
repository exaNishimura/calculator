import { beforeEach, describe, expect, it } from 'vitest';
import { SET_MAX } from '@/constants';
import type { Team } from '@/types/domain';
import {
  addInvestment,
  canBorrow,
  computeFinalAsset,
  EventAssignmentService,
  EventCalculationService,
  executeBorrow,
  GameProgressError,
  GameProgressService,
  getRemainingBudget,
  isEditable,
  isNotReadyForEvent,
  rankTeams,
  removeInvestment,
  summarizePreparation,
  toPreparationLabel,
} from '@/services';
import {
  createLocalRepositories,
  seedDemoTeams,
} from '@/services/repositories';
import { createMemoryStorage } from '@/services/repositories/storage';

function investingTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-test',
    teamName: 'テスト',
    teamCode: 'test',
    currentSet: 1,
    currentAsset: 100_000,
    totalDebt: 0,
    netAsset: 100_000,
    status: 'investing',
    pendingInvestments: null,
    investmentSubmittedAt: null,
    borrowedInCurrentSet: false,
    loanApplicationAmount: null,
    loanAppliedAt: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('InvestmentService', () => {
  const team = investingTeam();

  it('adds valid investment and tracks remaining budget', () => {
    const draft = { team, investments: [] };
    const first = addInvestment(draft, {
      sector: 'agriculture',
      amount: 30_000,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(getRemainingBudget(first.value)).toBe(70_000);

    const second = addInvestment(first.value, {
      sector: 'food',
      amount: 20_000,
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(getRemainingBudget(second.value)).toBe(50_000);
    }
  });

  it('rejects invalid unit and exceeding asset', () => {
    const draft = { team, investments: [] };
    const badUnit = addInvestment(draft, {
      sector: 'it',
      amount: 15_000,
    });
    expect(badUnit.ok).toBe(false);

    const badTotal = addInvestment(draft, {
      sector: 'it',
      amount: 110_000,
    });
    expect(badTotal.ok).toBe(false);
    if (!badTotal.ok) {
      expect(badTotal.error.code).toBe('EXCEEDS_ASSET');
    }
  });

  it('blocks edits when not investing', () => {
    const locked = investingTeam({ status: 'investment_submitted' });
    const draft = { team: locked, investments: [] };
    expect(isEditable(locked.status)).toBe(false);

    const result = addInvestment(draft, {
      sector: 'food',
      amount: 10_000,
    });
    expect(result.ok).toBe(false);

    const removed = removeInvestment(
      { team: locked, investments: [{ id: 'x', sector: 'food', amount: 10_000 }] },
      'x',
    );
    expect(removed.investments).toHaveLength(1);
  });

  it('removes investment line when editable', () => {
    const line = { id: 'line-1', sector: 'food' as const, amount: 10_000 };
    const draft = { team, investments: [line] };
    const next = removeInvestment(draft, 'line-1');
    expect(next.investments).toHaveLength(0);
  });
});

describe('BorrowingService', () => {
  it('executes borrow once per set and updates assets', () => {
    const team = investingTeam({ currentAsset: 5_000 });
    expect(canBorrow(team)).toBe(true);

    const result = executeBorrow(team);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currentAsset).toBe(85_000);
      expect(result.value.totalDebt).toBe(100_000);
      expect(result.value.borrowedInCurrentSet).toBe(true);
      expect(canBorrow(result.value)).toBe(false);
    }
  });

  it('rejects borrow when asset is high enough', () => {
    const team = investingTeam({ currentAsset: 50_000 });
    const result = executeBorrow(team);
    expect(result.ok).toBe(false);
  });

  it('computes final asset as net asset', () => {
    const team = investingTeam({
      currentAsset: 200_000,
      totalDebt: 100_000,
    });
    expect(computeFinalAsset(team)).toBe(100_000);
  });
});

describe('EventAssignmentService', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('returns active event only when team set matches session', async () => {
    const repos = createLocalRepositories(storage);
    const service = new EventAssignmentService(repos.gameSession);
    await service.assignEventForSet(1, 'evt_03');
    const session = await service.getSession();

    const team = investingTeam({ currentSet: 1 });
    expect(service.getActiveEventForTeam(team, session)).toBe('evt_03');

    const otherSet = investingTeam({ currentSet: 2 });
    expect(service.getActiveEventForTeam(otherSet, session)).toBeNull();
  });
});

describe('EventCalculationService', () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    storage.clear();
  });

  it('previews set result when event is assigned', async () => {
    const repos = createLocalRepositories(storage);
    await repos.gameSession.assignEvent(1, 'evt_01');
    const session = await repos.gameSession.get();
    const calc = new EventCalculationService();

    const team = investingTeam({ currentAsset: 100_000 });
    const investments = [{ id: '1', sector: 'agriculture' as const, amount: 50_000 }];
    const result = calc.preview(team, investments, session);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.uninvestedCarry).toBe(50_000);
      expect(result.value.setEndingAsset).toBeGreaterThan(50_000);
    }
  });

  it('returns EVENT_NOT_ASSIGNED when session has no matching event', async () => {
    const repos = createLocalRepositories(storage);
    const session = await repos.gameSession.get();
    const calc = new EventCalculationService();
    const team = investingTeam();

    const result = calc.preview(team, [], session);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EVENT_NOT_ASSIGNED');
    }
  });
});

describe('GameProgressService', () => {
  const storage = createMemoryStorage();
  let progress: GameProgressService;

  beforeEach(async () => {
    storage.clear();
    const repos = createLocalRepositories(storage);
    await seedDemoTeams(repos.teams);
    progress = new GameProgressService(
      repos,
      new EventCalculationService(),
    );
  });

  async function sampleTeam(): Promise<Team> {
    const repos = createLocalRepositories(storage);
    return (await repos.teams.getByCode('shogai')) as Team;
  }

  it('runs full set flow from investing to next set', async () => {
    const repos = createLocalRepositories(storage);
    const team = await sampleTeam();
    const teamWithAsset = await repos.teams.upsert({
      ...team,
      currentAsset: 100_000,
    });
    const investments = [
      { id: 'inv-1', sector: 'agriculture' as const, amount: 50_000 },
    ];

    const submitted = await progress.completeInvestmentSubmission(
      teamWithAsset.id,
      investments,
    );
    expect(submitted.status).toBe('investment_submitted');
    expect(submitted.pendingInvestments).toHaveLength(1);

    const waiting = await progress.proceedToEvent(teamWithAsset.id);
    expect(waiting.status).toBe('waiting_event');

    await repos.gameSession.assignEvent(1, 'evt_01');
    const session = await repos.gameSession.get();

    const confirmed = await progress.confirmSetResult(teamWithAsset.id, {
      setNumber: 1,
      startingAsset: teamWithAsset.currentAsset,
      investments,
      selectedEventId: 'evt_01',
      borrowedInSet: false,
    });

    expect(confirmed.setResult.setNumber).toBe(1);
    expect(confirmed.team.status).toBe('investing');
    expect(confirmed.team.currentSet).toBe(2);
    expect(confirmed.team.pendingInvestments).toBeNull();
    expect(confirmed.team.borrowedInCurrentSet).toBe(false);

    const calc = new EventCalculationService();
    const preview = calc.preview(confirmed.team, investments, session);
    expect(preview.ok).toBe(false);
  });

  it('finishes game after SET6', async () => {
    const repos = createLocalRepositories(storage);
    let team = await sampleTeam();
    team = await repos.teams.upsert({
      ...team,
      currentSet: SET_MAX,
      status: 'waiting_event',
      pendingInvestments: [],
    });
    await repos.gameSession.assignEvent(SET_MAX, 'evt_16');

    const confirmed = await progress.confirmSetResult(team.id, {
      setNumber: SET_MAX,
      startingAsset: team.currentAsset,
      investments: [],
      selectedEventId: 'evt_16',
      borrowedInSet: false,
    });

    expect(confirmed.team.status).toBe('finished');
    expect(confirmed.team.currentSet).toBe(SET_MAX);
  });

  it('starts set from not_started', async () => {
    const repos = createLocalRepositories(storage);
    const team = await sampleTeam();
    await repos.teams.upsert({ ...team, status: 'not_started' });

    const started = await progress.startSet(team.id);
    expect(started.status).toBe('investing');
    expect(started.currentSet).toBe(1);
  });

  it('throws on invalid status transitions', async () => {
    const team = await sampleTeam();
    await expect(
      progress.proceedToEvent(team.id),
    ).rejects.toBeInstanceOf(GameProgressError);
  });
});

describe('RankingService', () => {
  it('ranks teams by net asset descending', () => {
    const teams = [
      investingTeam({ id: 'a', teamName: 'A', currentAsset: 100_000, totalDebt: 0 }),
      investingTeam({ id: 'b', teamName: 'B', currentAsset: 200_000, totalDebt: 50_000 }),
      investingTeam({ id: 'c', teamName: 'C', currentAsset: 50_000, totalDebt: 0 }),
    ];

    const ranked = rankTeams(teams);
    expect(ranked[0].id).toBe('b');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].netAsset).toBe(150_000);
    expect(ranked[1].netAsset).toBe(100_000);
  });
});

describe('PreparationStatusService', () => {
  it('maps status to labels and summarizes submitted teams', () => {
    expect(toPreparationLabel('investing')).toBe('入力中');
    expect(toPreparationLabel('investment_submitted')).toBe('投資完了');
    expect(toPreparationLabel('waiting_event')).toBe('イベント待ち');
    expect(toPreparationLabel('finished')).toBe('終了');

    const teams = [
      investingTeam({ id: '1', currentSet: 1, status: 'investing' }),
      investingTeam({ id: '2', currentSet: 1, status: 'investment_submitted' }),
      investingTeam({ id: '3', currentSet: 1, status: 'waiting_event' }),
      investingTeam({ id: '4', currentSet: 2, status: 'investment_submitted' }),
    ];

    const summary = summarizePreparation(teams, 1);
    expect(summary.totalTeams).toBe(3);
    expect(summary.investmentSubmittedCount).toBe(2);
    expect(isNotReadyForEvent(teams[0])).toBe(true);
    expect(isNotReadyForEvent(teams[1])).toBe(false);
  });
});
