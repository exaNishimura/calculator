import { AuthService } from './authService';
import { repositories } from './repositories';
import { SyncService } from './syncService';

export const authService = new AuthService(repositories.teams);
export const syncService = new SyncService(repositories);

export function initSyncServiceRealtime(): () => void {
  return syncService.initRealtime();
}
