import type { EventId, GameSession, SetResult, Team } from '@/types/domain';

export interface IGameSessionRepository {
  get(): Promise<GameSession>;
  save(session: GameSession): Promise<GameSession>;
  assignEvent(setNumber: number, eventId: EventId): Promise<GameSession>;
  reset(): Promise<void>;
}

export interface ITeamRepository {
  getByCode(teamCode: string): Promise<Team | null>;
  getById(id: string): Promise<Team | null>;
  listAll(): Promise<Team[]>;
  upsert(team: Team): Promise<Team>;
  seedAll?(teams: Team[]): Promise<Team[]>;
  resetAll(): Promise<void>;
}

export interface ISetResultRepository {
  listByTeam(teamId: string): Promise<SetResult[]>;
  create(result: SetResult): Promise<SetResult>;
  resetAll(): Promise<void>;
}

export interface LocalRepositories {
  gameSession: IGameSessionRepository;
  teams: ITeamRepository;
  setResults: ISetResultRepository;
  resetAll(): Promise<void>;
}
