import { create } from 'zustand';
import type { InvestmentLine, SetResult, Team } from '@/types/domain';
import {
  addInvestment as addInvestmentLine,
  removeInvestment as removeInvestmentLine,
} from '@/services/investmentService';
import { isInvestmentEditable } from '@/services/types';
import { repositories } from '@/services/repositories';
import { STORAGE_KEYS } from '@/services/repositories/storage';
import { syncService } from '@/services/instances';

interface TeamDraftStoreState {
  teamCode: string | null;
  team: Team | null;
  setResults: SetResult[];
  viewingSetNumber: number;
  isViewingPastSet: boolean;
  investments: InvestmentLine[];
  loading: boolean;
  error: string | null;
  loadTeam: (teamCode: string) => Promise<Team | null>;
  syncFromServer: (teamCode: string) => Promise<void>;
  selectViewingSet: (setNumber: number) => void;
  getInvestmentBudget: () => number;
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

function resolveCurrentSetInvestments(
  team: Team,
  teamCode: string,
): InvestmentLine[] {
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
  if (!isInvestmentEditable(team.status)) {
    return;
  }
  syncService.backupDraft(teamCode, { team, investments });
}

function applyViewingSet(
  team: Team,
  setResults: SetResult[],
  setNumber: number,
  teamCode: string,
): Pick<
  TeamDraftStoreState,
  'viewingSetNumber' | 'isViewingPastSet' | 'investments'
> {
  if (setNumber === team.currentSet) {
    const investments = resolveCurrentSetInvestments(team, teamCode);
    persistDraft(team, investments, teamCode);
    return {
      viewingSetNumber: setNumber,
      isViewingPastSet: false,
      investments,
    };
  }

  const record = setResults.find((row) => row.setNumber === setNumber);
  if (!record) {
    const investments = resolveCurrentSetInvestments(team, teamCode);
    return {
      viewingSetNumber: team.currentSet,
      isViewingPastSet: false,
      investments,
    };
  }

  return {
    viewingSetNumber: setNumber,
    isViewingPastSet: true,
    investments: record.investments.map((line) => ({ ...line })),
  };
}

export const useTeamDraftStore = create<TeamDraftStoreState>((set, get) => ({
  teamCode: null,
  team: null,
  setResults: [],
  viewingSetNumber: 1,
  isViewingPastSet: false,
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

    const setResults = await repositories.setResults.listByTeam(team.id);
    const viewing = applyViewingSet(team, setResults, team.currentSet, normalized);
    set({
      team,
      setResults,
      loading: false,
      error: null,
      ...viewing,
    });
    return team;
  },

  async syncFromServer(teamCode) {
    const normalized = teamCode.trim().toLowerCase();
    const { viewingSetNumber } = get();
    const team = await repositories.teams.getByCode(normalized);
    if (!team) {
      return;
    }

    const setResults = await repositories.setResults.listByTeam(team.id);
    const viewing = applyViewingSet(
      team,
      setResults,
      viewingSetNumber,
      normalized,
    );
    set({ team, setResults, teamCode: normalized, ...viewing });
  },

  selectViewingSet(setNumber) {
    const { team, teamCode, setResults } = get();
    if (!team || !teamCode) {
      return;
    }
    const viewing = applyViewingSet(team, setResults, setNumber, teamCode);
    set({ ...viewing, error: null });
  },

  getInvestmentBudget() {
    const { team, isViewingPastSet, setResults, viewingSetNumber } = get();
    if (!team) {
      return 0;
    }
    if (!isViewingPastSet) {
      return team.currentAsset;
    }
    const record = setResults.find((row) => row.setNumber === viewingSetNumber);
    return record?.startingAsset ?? team.currentAsset;
  },

  setInvestments(investments) {
    const { team, teamCode, isViewingPastSet } = get();
    if (!team || !teamCode || isViewingPastSet) {
      return;
    }
    set({ investments });
    persistDraft(team, investments, teamCode);
  },

  addInvestment(line) {
    const { team, teamCode, investments, isViewingPastSet } = get();
    if (!team || !teamCode) {
      return false;
    }

    const editOptions = isViewingPastSet
      ? { forceEditable: true, assetCap: get().getInvestmentBudget() }
      : undefined;

    const result = addInvestmentLine({ team, investments }, line, editOptions);
    if (!result.ok) {
      set({ error: result.error.message });
      return false;
    }

    set({ investments: result.value.investments, error: null });
    if (!isViewingPastSet) {
      persistDraft(team, result.value.investments, teamCode);
    }
    return true;
  },

  removeInvestment(lineId) {
    const { team, teamCode, investments, isViewingPastSet } = get();
    if (!team || !teamCode) {
      return;
    }

    const next = removeInvestmentLine(
      { team, investments },
      lineId,
      isViewingPastSet ? { forceEditable: true } : undefined,
    );
    set({ investments: next.investments, error: null });
    if (!isViewingPastSet) {
      persistDraft(team, next.investments, teamCode);
    }
  },

  clear() {
    set({
      teamCode: null,
      team: null,
      setResults: [],
      viewingSetNumber: 1,
      isViewingPastSet: false,
      investments: [],
      loading: false,
      error: null,
    });
  },
}));

export function initTeamDraftStoreSync(teamCode: string): () => void {
  const normalized = teamCode.trim().toLowerCase();

  return syncService.subscribe(({ key }) => {
    if (
      key !== STORAGE_KEYS.session &&
      key !== STORAGE_KEYS.teams &&
      key !== STORAGE_KEYS.setResults
    ) {
      return;
    }
    void useTeamDraftStore.getState().syncFromServer(normalized);
  });
}
