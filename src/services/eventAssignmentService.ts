import type { EventId, GameSession, Team } from '@/types/domain';
import type { IGameSessionRepository } from './repositories/types';

export function getActiveEventForTeam(
  team: Team,
  session: GameSession,
): EventId | null {
  if (
    session.activeEventId === null ||
    session.activeEventSetNumber === null
  ) {
    return null;
  }
  if (team.currentSet !== session.activeEventSetNumber) {
    return null;
  }
  return session.activeEventId;
}

export class EventAssignmentService {
  constructor(private readonly gameSession: IGameSessionRepository) {}

  getSession(): Promise<GameSession> {
    return this.gameSession.get();
  }

  assignEventForSet(
    setNumber: number,
    eventId: EventId,
  ): Promise<GameSession> {
    return this.gameSession.assignEvent(setNumber, eventId);
  }

  getActiveEventForTeam(team: Team, session: GameSession): EventId | null {
    return getActiveEventForTeam(team, session);
  }
}
