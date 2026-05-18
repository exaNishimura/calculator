import type {
  EventId,
  GameSession,
  InvestmentLine,
  Result,
  SetCalculationResult,
  Team,
  ValidationError,
} from '@/types/domain';
import { calculateSetResultSafe } from '@/utils/calculator';
import { getActiveEventForTeam } from './eventAssignmentService';

function eventNotAssigned(): Result<never, ValidationError> {
  return {
    ok: false,
    error: {
      code: 'EVENT_NOT_ASSIGNED',
      message: 'イベントが割り当てられていません',
    },
  };
}

function resolveEventId(
  team: Team,
  session: GameSession,
): EventId | null {
  return getActiveEventForTeam(team, session);
}

export function previewSetCalculation(
  team: Team,
  investments: InvestmentLine[],
  session: GameSession,
): Result<SetCalculationResult> {
  const eventId = resolveEventId(team, session);
  if (!eventId) {
    return eventNotAssigned();
  }

  return calculateSetResultSafe({
    currentAsset: team.currentAsset,
    investments,
    eventId,
  });
}

export function applySetCalculation(
  team: Team,
  investments: InvestmentLine[],
  session: GameSession,
): Result<SetCalculationResult> {
  return previewSetCalculation(team, investments, session);
}

export class EventCalculationService {
  preview(
    team: Team,
    investments: InvestmentLine[],
    session: GameSession,
  ): Result<SetCalculationResult> {
    return previewSetCalculation(team, investments, session);
  }

  apply(
    team: Team,
    investments: InvestmentLine[],
    session: GameSession,
  ): Result<SetCalculationResult> {
    return applySetCalculation(team, investments, session);
  }
}
