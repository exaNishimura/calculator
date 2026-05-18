import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import {
  AddInvestmentForm,
  AssetHeader,
  BorrowPanel,
  CurrentAssetInput,
  InvestmentList,
  TeamActionBar,
} from '@/components/team';
import { INVESTMENT_UNIT } from '@/constants';
import {
  EventCalculationService,
  GameProgressService,
  getRemainingBudget,
  isEditable,
} from '@/services';
import { syncService } from '@/services/instances';
import { STORAGE_KEYS } from '@/services/repositories/storage';
import { repositories } from '@/services/repositories';
import { useTeamDraftStore } from '@/stores';
import type { Sector } from '@/types/domain';

export function TeamEntryPage() {
  const { teamCode = '' } = useParams<{ teamCode: string }>();
  const team = useTeamDraftStore((state) => state.team);
  const investments = useTeamDraftStore((state) => state.investments);
  const storeError = useTeamDraftStore((state) => state.error);
  const addInvestment = useTeamDraftStore((state) => state.addInvestment);
  const removeInvestment = useTeamDraftStore((state) => state.removeInvestment);
  const syncFromServer = useTeamDraftStore((state) => state.syncFromServer);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const progress = useMemo(
    () => new GameProgressService(repositories, new EventCalculationService()),
    [],
  );

  if (!team) {
    return (
      <AppShell title="読み込み中">
        <p className="text-game-muted">チームデータを読み込んでいます…</p>
      </AppShell>
    );
  }

  const editable = isEditable(team.status);
  const isSet1InitialSetup = team.currentSet === 1;
  const showCurrentAssetInput = editable && isSet1InitialSetup;
  const draft = { team, investments };
  const remainingBudget = getRemainingBudget(draft);
  const maxUnits = Math.max(0, Math.floor(remainingBudget / INVESTMENT_UNIT));
  const hasCurrentAsset = team.currentAsset > 0;
  const canCompleteInvestment =
    !isSet1InitialSetup || hasCurrentAsset;

  const refreshTeam = async () => {
    syncService.notify(STORAGE_KEYS.teams);
    await syncFromServer(teamCode);
  };

  const handleAddInvestment = (sector: Sector, amount: number) => {
    setActionError(null);
    return addInvestment({ sector, amount });
  };

  const handleSaveCurrentAsset = async (amount: number) => {
    const saved = await syncService.persistTeam({
      ...team,
      currentAsset: amount,
    });
    useTeamDraftStore.setState({ team: saved });
    await refreshTeam();
  };

  const handleCompleteInvestment = async () => {
    setActionError(null);
    setBusy(true);
    try {
      await progress.completeInvestmentSubmission(team.id, investments);
      await refreshTeam();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : '投資完了に失敗しました',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleProceedToEvent = async () => {
    setActionError(null);
    setBusy(true);
    try {
      await progress.proceedToEvent(team.id);
      await refreshTeam();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'イベント画面への遷移に失敗しました',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppShell title={team.teamName} contentClassName="pb-36">
        <section className="space-y-4">
          <p className="text-sm text-game-muted">ファシリテーター操作画面</p>

          {showCurrentAssetInput ? (
            <CurrentAssetInput
              team={team}
              investments={investments}
              onSave={handleSaveCurrentAsset}
            />
          ) : null}
          <AssetHeader
            team={team}
            remainingBudget={remainingBudget}
            showCurrentAsset={!showCurrentAssetInput}
          />
          <BorrowPanel team={team} editable={editable} />
          <InvestmentList
            investments={investments}
            editable={editable}
            onRemove={removeInvestment}
          />
          {editable && hasCurrentAsset && maxUnits > 0 ? (
            <AddInvestmentForm
              maxUnits={maxUnits}
              onAdd={handleAddInvestment}
            />
          ) : null}
          {storeError ? (
            <p className="text-sm text-game-loss" role="alert">
              {storeError}
            </p>
          ) : null}
          {actionError ? (
            <p className="text-sm text-game-loss" role="alert">
              {actionError}
            </p>
          ) : null}
        </section>
      </AppShell>
      <TeamActionBar
        team={team}
        teamCode={teamCode}
        busy={busy}
        canCompleteInvestment={canCompleteInvestment}
        onCompleteInvestment={() => void handleCompleteInvestment()}
        onProceedToEvent={() => void handleProceedToEvent()}
      />
    </>
  );
}
