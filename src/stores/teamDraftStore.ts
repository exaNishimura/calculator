import { create } from 'zustand';
import type { InvestmentLine, Team } from '@/types/domain';
import {
  addInvestment as addInvestmentLine,
  removeInvestment as removeInvestmentLine,
} from '@/services/investmentService';
import { repositories } from '@/services/repositories';
import { STORAGE_KEYS } from '@/services/repositories/storage';
import { syncService } from '@/services/instances';

interface TeamDraftStoreState {
  teamCode: string | null;
  team: Team | null;
  investments: InvestmentLine[];
  loading: boolean;
  error: string | null;
  loadTeam: (teamCode: string) => Promise<Team | null>;
  syncFromServer: (teamCode: string) => Promise<void>;
  setInvestments: (investments: InvestmentLine[]) => void;
  addInvestment: (line: Omit<InvestmentLine, 'id'>) => boolean;
  removeInvestment: (lineId: string) => void;
  clear: () => void;
}

function isDraftForCurrentTeamState(
  draftTeam: Team,
  team: Team,
): boolean {
  return (
    draftTeam.id === team.id &&
    draftTeam.currentSet === team.currentSet &&
    draftTeam.status === team.status
  );
}

function resolveInvestments(team: Team, teamCode: string): InvestmentLine[] {
  if (team.status !== 'investing') {
    return team.pendingInvestments ? [...team.pendingInvestments] : [];
  }

  const restored = syncService.restoreDraft(teamCode);
  if (restored && isDraftForCurrentTeamState(restored.team, team)) {
    return [...restored.investments];
  }

  if (restored) {
    syncService.clearDraft(teamCode);
  }

  return [];
}

function persistDraft(team: Team, investments: InvestmentLine[], teamCode: string) {
  if (team.status !== 'investing') {
    return;
  }
  syncService.backupDraft(teamCode, { team, investments });
}

export const useTeamDraftStore = create<TeamDraftStoreState>((set, get) => ({
  teamCode: null,
  team: null,
  investments: [],
  loading: false,
  error: null,

  async loadTeam(teamCode) {
    const normalized = teamCode.trim().toLowerCase();
    set({ loading: true, error: null, teamCode: normalized });

    const team = await repositories.teams.getByCode(normalized);
    if (!team) {
      set({ loading: false, team: null, error: 'チームが見つかりません' });
      return null;
    }

    const investments = resolveInvestments(team, normalized);
    set({ team, investments, loading: false });
    persistDraft(team, investments, normalized);
    return team;
  },

  async syncFromServer(teamCode) {
    const normalized = teamCode.trim().toLowerCase();
    const team = await repositories.teams.getByCode(normalized);
    if (!team) {
      return;
    }

    const investments = resolveInvestments(team, normalized);
    set({ team, investments, teamCode: normalized });

    if (team.status === 'investing') {
      persistDraft(team, investments, normalized);
    }
  },

  setInvestments(investments) {
    const { team, teamCode } = get();
    if (!team || !teamCode) {
      return;
    }
    set({ investments });
    persistDraft(team, investments, teamCode);
  },

  addInvestment(line) {
    const { team, teamCode, investments } = get();
    if (!team || !teamCode) {
      return false;
    }

    const result = addInvestmentLine({ team, investments }, line);
    if (!result.ok) {
      set({ error: result.error.message });
      return false;
    }

    set({ investments: result.value.investments, error: null });
    persistDraft(team, result.value.investments, teamCode);
    return true;
  },

  removeInvestment(lineId) {
    const { team, teamCode, investments } = get();
    if (!team || !teamCode) {
      return;
    }

    const next = removeInvestmentLine({ team, investments }, lineId);
    set({ investments: next.investments, error: null });
    persistDraft(team, next.investments, teamCode);
  },

  clear() {
    set({
      teamCode: null,
      team: null,
      investments: [],
      loading: false,
      error: null,
    });
  },
}));

export function initTeamDraftStoreSync(teamCode: string): () => void {
  const normalized = teamCode.trim().toLowerCase();

  return syncService.subscribe(({ key }) => {
    if (key !== STORAGE_KEYS.session && key !== STORAGE_KEYS.teams) {
      return;
    }
    void useTeamDraftStore.getState().syncFromServer(normalized);
  });
}
