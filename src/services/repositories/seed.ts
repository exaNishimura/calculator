import { FACILITATOR_TEAMS } from '@/constants/teams';
import type { Team } from '@/types/domain';
import { LocalTeamRepository } from './teamRepository';
import type { ITeamRepository } from './types';

export const SEED_VERSION = 'facilitator-teams-v2';

export function createDemoTeams(): Team[] {
  const now = new Date().toISOString();
  const base = {
    currentSet: 1,
    currentAsset: 0,
    totalDebt: 0,
    status: 'investing' as const,
    pendingInvestments: null,
    investmentSubmittedAt: null,
    borrowedInCurrentSet: false,
    loanApplicationAmount: null,
    loanAppliedAt: null,
    updatedAt: now,
  };

  return FACILITATOR_TEAMS.map((entry) => ({
    ...base,
    id: entry.id,
    teamName: entry.teamName,
    teamCode: entry.teamCode,
    netAsset: base.currentAsset,
  }));
}

/** 開発用: 委員会チームを localStorage に投入する */
export async function seedDemoTeams(
  teamRepository: ITeamRepository,
): Promise<Team[]> {
  const teams = createDemoTeams();
  if (teamRepository instanceof LocalTeamRepository) {
    return teamRepository.seedAll(teams);
  }
  const saved: Team[] = [];
  for (const team of teams) {
    saved.push(await teamRepository.upsert(team));
  }
  return saved;
}
