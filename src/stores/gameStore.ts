import { create } from 'zustand';
import type { GameSession, Team } from '@/types/domain';
import { repositories } from '@/services/repositories';
import { STORAGE_KEYS } from '@/services/repositories/storage';
import { syncService } from '@/services/instances';

interface GameStoreState {
  teams: Team[];
  session: GameSession | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  reload: () => Promise<void>;
  setSession: (session: GameSession) => void;
  upsertTeamLocal: (team: Team) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  teams: [],
  session: null,
  loading: false,

  async hydrate() {
    set({ loading: true });
    try {
      const [teams, session] = await Promise.all([
        repositories.teams.listAll(),
        repositories.gameSession.get(),
      ]);
      set({ teams, session, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  async reload() {
    await get().hydrate();
  },

  setSession(session) {
    set({ session });
  },

  upsertTeamLocal(team) {
    set((state) => {
      const index = state.teams.findIndex((item) => item.id === team.id);
      if (index < 0) {
        return { teams: [...state.teams, team] };
      }
      const teams = [...state.teams];
      teams[index] = team;
      return { teams };
    });
  },
}));

export function initGameStoreSync(): () => void {
  return syncService.subscribe(({ key }) => {
    if (
      key !== STORAGE_KEYS.session &&
      key !== STORAGE_KEYS.teams &&
      key !== STORAGE_KEYS.setResults
    ) {
      return;
    }
    void useGameStore.getState().reload();
  });
}
