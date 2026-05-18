import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EventAssignPanel,
  PrepSummaryBar,
  TeamLeaderboardTable,
} from '@/components/admin';
import { AdminShell } from '@/components/layout/AdminShell';
import { GameButton } from '@/components/ui';
import { getEventById } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { rankTeams, summarizePreparation } from '@/services';
import { syncService } from '@/services/instances';
import { useGameStore } from '@/stores';
import { exportAdminTeamsCsv } from '@/utils/adminCsv';
import type { EventId } from '@/types/domain';

const SEED_VERSION_KEY = 'game02:seedVersion';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logoutAdmin } = useAuth();
  const teams = useGameStore((state) => state.teams);
  const session = useGameStore((state) => state.session);
  const loading = useGameStore((state) => state.loading);
  const reload = useGameStore((state) => state.reload);
  const [busy, setBusy] = useState(false);

  const summary = useMemo(() => summarizePreparation(teams), [teams]);
  const rankedTeams = useMemo(
    () => rankTeams(teams, teams.some((team) => team.status === 'finished')),
    [teams],
  );
  const activeEvent =
    session?.activeEventId != null
      ? getEventById(session.activeEventId)
      : null;

  const handleAssignEvent = async (eventId: EventId) => {
    setBusy(true);
    try {
      await syncService.assignEvent(summary.currentSet, eventId);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const handleExportCsv = () => {
    exportAdminTeamsCsv(teams, session);
  };

  const handleResetGame = async () => {
    const ok = window.confirm(
      'ゲームを初期状態に戻します。全チームの資産・投資・SET結果・イベント割当がリセットされます。よろしいですか？',
    );
    if (!ok) {
      return;
    }
    setBusy(true);
    try {
      await syncService.resetGame(SEED_VERSION_KEY);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const headerActions = (
    <>
      <GameButton
        variant="secondary"
        fullWidth={false}
        className="min-h-11 px-4 text-base"
        disabled={busy || loading}
        onClick={handleExportCsv}
      >
        CSV 出力
      </GameButton>
      <GameButton
        variant="danger"
        fullWidth={false}
        className="min-h-11 px-4 text-base"
        disabled={busy || loading}
        onClick={() => void handleResetGame()}
      >
        ゲームリセット
      </GameButton>
      <GameButton
        variant="secondary"
        fullWidth={false}
        className="min-h-11 px-4 text-base"
        onClick={() => {
          logoutAdmin();
          navigate('/admin');
        }}
      >
        ログアウト
      </GameButton>
    </>
  );

  return (
    <AdminShell title="運営ダッシュボード" actions={headerActions}>
      {loading ? (
        <p className="text-game-muted">読み込み中…</p>
      ) : (
        <section className="space-y-6">
          <PrepSummaryBar
            summary={summary}
            activeEventName={activeEvent?.name ?? null}
          />
          <EventAssignPanel
            setNumber={summary.currentSet}
            activeEventId={session?.activeEventId ?? null}
            busy={busy}
            onAssign={handleAssignEvent}
          />
          <TeamLeaderboardTable teams={rankedTeams} />
          <p className="text-xs text-game-muted">
            強調: 黄枠=投資未完了 · 青枠=イベント待ち · リング=借入あり
          </p>
        </section>
      )}
    </AdminShell>
  );
}
