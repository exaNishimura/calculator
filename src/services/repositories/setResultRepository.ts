import { DuplicateSetResultError, type SetResult } from '@/types/domain';
import {
  STORAGE_KEYS,
  readJson,
  writeJson,
  type StorageAdapter,
} from './storage';
import type { ISetResultRepository } from './types';

export class LocalSetResultRepository implements ISetResultRepository {
  constructor(private readonly storage: StorageAdapter) {}

  private readAll(): SetResult[] {
    const data = readJson<SetResult[]>(this.storage, STORAGE_KEYS.setResults);
    return Array.isArray(data) ? data : [];
  }

  private writeAll(results: SetResult[]): void {
    writeJson(this.storage, STORAGE_KEYS.setResults, results);
  }

  async listByTeam(teamId: string): Promise<SetResult[]> {
    return this.readAll()
      .filter((result) => result.teamId === teamId)
      .sort((a, b) => a.setNumber - b.setNumber);
  }

  async create(result: SetResult): Promise<SetResult> {
    const results = this.readAll();
    const exists = results.some(
      (item) =>
        item.teamId === result.teamId && item.setNumber === result.setNumber,
    );

    if (exists) {
      throw new DuplicateSetResultError(result.teamId, result.setNumber);
    }

    const next: SetResult = {
      ...result,
      completedAt: result.completedAt || new Date().toISOString(),
    };
    results.push(next);
    this.writeAll(results);
    return next;
  }

  async resetAll(): Promise<void> {
    this.writeAll([]);
  }
}
