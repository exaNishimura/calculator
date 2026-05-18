import type { Team } from '@/types/domain';
import { computeNetAsset } from '@/utils/validation';
import type { RankedTeam } from './types';

export function rankTeams(teams: Team[], _gameFinished = false): RankedTeam[] {
  const sorted = [...teams].sort((a, b) => {
    const netA = computeNetAsset(a.currentAsset, a.totalDebt);
    const netB = computeNetAsset(b.currentAsset, b.totalDebt);
    if (netB !== netA) {
      return netB - netA;
    }
    return a.teamName.localeCompare(b.teamName, 'ja');
  });

  return sorted.map((team, index) => ({
    ...team,
    rank: index + 1,
    netAsset: computeNetAsset(team.currentAsset, team.totalDebt),
  }));
}

export class RankingService {
  rankTeams(teams: Team[], gameFinished = false): RankedTeam[] {
    return rankTeams(teams, gameFinished);
  }
}
