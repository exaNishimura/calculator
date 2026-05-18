import { Link } from 'react-router-dom';
import type { Team, TeamStatus } from '@/types/domain';
import { GameButton } from '@/components/ui';

interface TeamActionBarProps {
  team: Team;
  teamCode: string;
  busy: boolean;
  canCompleteInvestment?: boolean;
  onCompleteInvestment: () => void;
  onProceedToEvent: () => void;
}

function statusMessage(status: TeamStatus): string | null {
  switch (status) {
    case 'investment_submitted':
      return '投資を確定しました。内容を確認してイベント画面へ進んでください。';
    case 'waiting_event':
      return 'イベント画面で結果を確認・確定できます。';
    case 'finished':
      return 'ゲーム終了 — お疲れさまでした。';
    default:
      return null;
  }
}

export function TeamActionBar({
  team,
  teamCode,
  busy,
  canCompleteInvestment = true,
  onCompleteInvestment,
  onProceedToEvent,
}: TeamActionBarProps) {
  const message = statusMessage(team.status);

  return (
    <aside
      data-testid="team-action-bar"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-game-border bg-game-bg/95 px-4 py-4 backdrop-blur"
    >
      <section className="mx-auto flex w-full max-w-lg flex-col gap-2">
        {message ? (
          <p className="text-center text-sm text-game-muted">{message}</p>
        ) : null}
        {team.status === 'investing' ? (
          <GameButton
            disabled={busy || !canCompleteInvestment}
            onClick={onCompleteInvestment}
          >
            投資完了
          </GameButton>
        ) : null}
        {team.status === 'investment_submitted' ? (
          <GameButton disabled={busy} onClick={onProceedToEvent}>
            イベント画面へ進む
          </GameButton>
        ) : null}
        {team.status === 'waiting_event' || team.status === 'finished' ? (
          <Link
            to={`/team/${teamCode}/event`}
            className="block min-h-14 rounded-xl bg-game-accent px-6 text-center text-lg font-bold leading-[3.5rem] text-white"
          >
            イベント結果画面を開く
          </Link>
        ) : null}
      </section>
    </aside>
  );
}
