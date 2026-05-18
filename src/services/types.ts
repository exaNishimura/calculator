import type { Team, TeamStatus } from '@/types/domain';
import type { InvestmentLine } from '@/types/domain';

export interface TeamDraft {
  team: Team;
  investments: InvestmentLine[];
}

export type PreparationLabel =
  | '入力中'
  | '投資完了'
  | 'イベント待ち'
  | 'SET完了'
  | '終了';

export interface PreparationSummary {
  currentSet: number;
  totalTeams: number;
  investmentSubmittedCount: number;
}

export interface RankedTeam extends Team {
  rank: number;
  netAsset: number;
}

export type GameProgressErrorCode =
  | 'TEAM_NOT_FOUND'
  | 'INVALID_STATUS'
  | 'INVALID_INVESTMENTS'
  | 'SET_MISMATCH'
  | 'EVENT_NOT_ASSIGNED'
  | 'EVENT_MISMATCH';

export class GameProgressError extends Error {
  constructor(
    public readonly code: GameProgressErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameProgressError';
  }
}

export function isInvestmentEditable(status: TeamStatus): boolean {
  return status === 'investing';
}
