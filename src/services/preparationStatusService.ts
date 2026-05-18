import type { Team, TeamStatus } from '@/types/domain';
import type { PreparationLabel, PreparationSummary } from './types';

const SUBMITTED_STATUSES = new Set<TeamStatus>([
  'investment_submitted',
  'waiting_event',
]);

export function toPreparationLabel(status: TeamStatus): PreparationLabel {
  switch (status) {
    case 'not_started':
    case 'investing':
      return '入力中';
    case 'investment_submitted':
      return '投資完了';
    case 'waiting_event':
      return 'イベント待ち';
    case 'completed_set':
      return 'SET完了';
    case 'finished':
      return '終了';
    default:
      return '入力中';
  }
}

export function resolveFocusSet(teams: Team[], focusSet?: number): number {
  if (focusSet !== undefined) {
    return focusSet;
  }
  if (teams.length === 0) {
    return 1;
  }
  return Math.max(...teams.map((team) => team.currentSet));
}

export function summarizePreparation(
  teams: Team[],
  focusSet?: number,
): PreparationSummary {
  const currentSet = resolveFocusSet(teams, focusSet);
  const inSet = teams.filter((team) => team.currentSet === currentSet);

  const investmentSubmittedCount = inSet.filter((team) =>
    SUBMITTED_STATUSES.has(team.status),
  ).length;

  return {
    currentSet,
    totalTeams: inSet.length,
    investmentSubmittedCount,
  };
}

export function isNotReadyForEvent(team: Team): boolean {
  return team.status === 'investing';
}

export class PreparationStatusService {
  toLabel(status: TeamStatus): PreparationLabel {
    return toPreparationLabel(status);
  }

  summarize(teams: Team[], focusSet?: number): PreparationSummary {
    return summarizePreparation(teams, focusSet);
  }

  isNotReadyForEvent(team: Team): boolean {
    return isNotReadyForEvent(team);
  }
}
