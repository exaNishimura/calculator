import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import {
  AssignedEventPanel,
  EventResultsActionBar,
  SetCalculationPreview,
  SetResultConfirmed,
} from '@/components/event';
import { InvestmentList } from '@/components/team';
import { Card, WarningAlert } from '@/components/ui';
import { SET_MAX } from '@/constants';
import {
  EventCalculationService,
  GameProgressService,
  getActiveEventForTeam,
} from '@/services';
import { syncService } from '@/services/instances';
import { repositories } from '@/services/repositories';
import { STORAGE_KEYS } from '@/services/repositories/storage';
import { useGameStore, useTeamDraftStore } from '@/stores';
import type { EventId, SetCalculationResult } from '@/types/domain';
import { calculateSetResultSafe } from '@/utils/calculator';

interface ConfirmedView {
  setNumber: number;
  eventId: EventId;
  calculation: SetCalculationResult;
  isGameFinished: boolean;
}

function statusHint(status: string): string {
  switch (status) {
    case 'not_started':
      return 'SET が開始されていません。投資画面から開始してください。';
    case 'investing':
      return '投資画面で投資を入力し、投資完了まで進めてください。';
    case 'investment_submitted':
      return '投資画面から「イベント画面へ進む」を押してください。';
    default:
      return 'この画面はイベント待ちのときに利用できます。';
  }
}

export function EventResultsPage() {
  const { teamCode = '' } = useParams<{ teamCode: string }>();
  const team = useTeamDraftStore((state) => state.team);
  const investments = useTeamDraftStore((state) => state.investments);
  const syncFromServer = useTeamDraftStore((state) => state.syncFromServer);
  const session = useGameStore((state) => state.session);
  const hydrateGame = useGameStore((state) => state.hydrate);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedView | null>(null);

  useEffect(() => {
    if (!session) {
      void hydrateGame();
    }
  }, [session, hydrateGame]);

  const progress = useMemo(
    () => new GameProgressService(repositories, new EventCalculationService()),
    [],
  );
  const calcService = useMemo(() => new EventCalculationService(), []);

  const activeEventId =
    team && session ? getActiveEventForTeam(team, session) : null;

  const preview = useMemo(() => {
    if (!team || !session || !activeEventId) {
      return null;
    }
    return calcService.preview(team, investments, session);
  }, [team, investments, session, activeEventId, calcService]);

  const refreshTeam = async () => {
    syncService.notify(STORAGE_KEYS.teams);
    syncService.notify(STORAGE_KEYS.setResults);
    await syncFromServer(teamCode);
  };

  const handleConfirm = async () => {
    if (!team || !activeEventId || !preview?.ok) {
      return;
    }

    setActionError(null);
    setBusy(true);
    try {
      const { team: updated, setResult } = await progress.confirmSetResult(
        team.id,
        {
          setNumber: team.currentSet,
          startingAsset: team.currentAsset,
          investments,
          selectedEventId: activeEventId,
          borrowedInSet: team.borrowedInCurrentSet,
        },
      );

      const recalc = calculateSetResultSafe({
        currentAsset: setResult.startingAsset,
        investments: setResult.investments,
        eventId: setResult.selectedEvent,
      });

      setConfirmed({
        setNumber: setResult.setNumber,
        eventId: setResult.selectedEvent,
        calculation: recalc.ok ? recalc.value : preview.value,
        isGameFinished: updated.status === 'finished',
      });
      syncService.clearDraft(teamCode);
      useTeamDraftStore.setState({ team: updated, investments: [] });
      await refreshTeam();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : '計算の確定に失敗しました',
      );
    } finally {
      setBusy(false);
    }
  };

  if (!team) {
    return (
      <AppShell title="読み込み中">
        <p className="text-game-muted">チームデータを読み込んでいます…</p>
      </AppShell>
    );
  }

  if (confirmed) {
    return (
      <AppShell title={team.teamName} contentClassName="pb-8">
        <SetResultConfirmed
          setNumber={confirmed.setNumber}
          calculation={confirmed.calculation}
          teamCode={teamCode}
          isGameFinished={confirmed.isGameFinished}
        />
      </AppShell>
    );
  }

  if (team.status === 'finished') {
    return (
      <AppShell title={team.teamName}>
        <Card>
          <p className="text-white">ゲームは終了しています。</p>
          <p className="mt-2 text-sm text-game-muted">
            最終資産（実質）: {team.netAsset.toLocaleString('ja-JP')}P
          </p>
        </Card>
      </AppShell>
    );
  }

  if (team.status !== 'waiting_event') {
    return (
      <AppShell title={team.teamName}>
        <Card data-testid="event-results-status-gate">
          <p className="text-white">{statusHint(team.status)}</p>
          <Link
            to={`/team/${teamCode}`}
            className="mt-4 inline-block text-game-accent underline"
          >
            投資画面へ
          </Link>
        </Card>
      </AppShell>
    );
  }

  const canConfirm = Boolean(activeEventId && preview?.ok);

  return (
    <>
      <AppShell title={team.teamName} contentClassName="pb-36">
        <section className="space-y-4">
          <p className="text-sm text-game-muted">
            SET{team.currentSet} / {SET_MAX} — イベント結果
          </p>

          {activeEventId ? (
            <AssignedEventPanel team={team} session={session} />
          ) : (
            <WarningAlert title="イベント未割当">
              運営のイベント発表待ちです。確定後に計算プレビューが表示されます。
            </WarningAlert>
          )}

          <InvestmentList
            investments={investments}
            editable={false}
            onRemove={() => undefined}
          />

          {activeEventId && preview?.ok ? (
            <SetCalculationPreview result={preview.value} />
          ) : null}

          {actionError ? (
            <p className="text-sm text-game-loss" role="alert">
              {actionError}
            </p>
          ) : null}
        </section>
      </AppShell>
      <EventResultsActionBar
        teamCode={teamCode}
        busy={busy}
        canConfirm={canConfirm}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
