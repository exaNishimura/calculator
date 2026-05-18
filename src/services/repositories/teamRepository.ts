import type { Team } from '@/types/domain';
import { computeNetAsset } from '@/utils/validation';
import {
  STORAGE_KEYS,
  readJson,
  writeJson,
  type StorageAdapter,
} from './storage';
import type { ITeamRepository } from './types';

function normalizeTeam(team: Team): Team {
  const updatedAt = new Date().toISOString();
  return {
    ...team,
    netAsset: computeNetAsset(team.currentAsset, team.totalDebt),
    updatedAt,
  };
}

export class LocalTeamRepository implements ITeamRepository {
  constructor(private readonly storage: StorageAdapter) {}

  private readAll(): Team[] {
    const data = readJson<Team[]>(this.storage, STORAGE_KEYS.teams);
    return Array.isArray(data) ? data : [];
  }

  async seedAll(teams: Team[]): Promise<Team[]> {
    const normalized = teams.map((team) => normalizeTeam(team));
    this.writeAll(normalized);
    return normalized;
  }

  private writeAll(teams: Team[]): void {
    writeJson(this.storage, STORAGE_KEYS.teams, teams);
  }

  async getByCode(teamCode: string): Promise<Team | null> {
    const normalizedCode = teamCode.trim().toLowerCase();
    return (
      this.readAll().find(
        (team) => team.teamCode.toLowerCase() === normalizedCode,
      ) ?? null
    );
  }

  async getById(id: string): Promise<Team | null> {
    return this.readAll().find((team) => team.id === id) ?? null;
  }

  async listAll(): Promise<Team[]> {
    return [...this.readAll()].sort((a, b) =>
      a.teamName.localeCompare(b.teamName, 'ja'),
    );
  }

  async upsert(team: Team): Promise<Team> {
    const teams = this.readAll();
    const index = teams.findIndex((item) => item.id === team.id);
    const next = normalizeTeam(team);

    if (index >= 0) {
      teams[index] = next;
    } else {
      teams.push(next);
    }

    this.writeAll(teams);
    return next;
  }

  async resetAll(): Promise<void> {
    this.writeAll([]);
  }
}
