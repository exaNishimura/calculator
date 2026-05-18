import { Link } from 'react-router-dom';
import type { Team, TeamStatus } from '@/types/domain';
import { GameButton } from '@/components/ui';

interface TeamActionBarProps {
  team: Team;
  teamCode: string;
  busy: boolean;
  isViewingPastSet?: boolean;
  canCompleteInvestment?: boolean;
  onCompleteInvestment: () => void;
  onSavePastSet?: () => void;
  onProceedToEvent: () => void;
}

function statusMessage(status: TeamStatus): string | null {
  switch (status) {
    case 'investment_submitted':
      return '投資内容は修正できます。変更後は「投資を更新」で保存し、イベント画面へ進んでください。';
    case 'waiting_event':
      return '投資内容は修正できます。変更後は「投資を更新」で保存してください。';
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
  isViewingPastSet = false,
  canCompleteInvestment = true,
  onCompleteInvestment,
  onSavePastSet,
  onProceedToEvent,
}: TeamActionBarProps) {
  const message = isViewingPastSet
    ? '確定済み SET の投資を修正できます。保存すると以降の SET も再計算されます。'
    : statusMessage(team.status);

  return (
    <aside
      data-testid="team-action-bar"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-game-border bg-game-bg/95 px-4 py-4 backdrop-blur"
    >
      <section className="mx-auto flex w-full max-w-lg flex-col gap-2">
        {message ? (
          <p className="text-center text-sm text-game-muted">{message}</p>
        ) : null}
        {isViewingPastSet ? (
          <GameButton disabled={busy} onClick={onSavePastSet}>
            この SET の投資を保存
          </GameButton>
        ) : null}
        {!isViewingPastSet &&
        (team.status === 'investing' ||
          team.status === 'investment_submitted' ||
          team.status === 'waiting_event') ? (
          <GameButton
            disabled={busy || !canCompleteInvestment}
            onClick={onCompleteInvestment}
          >
            {team.status === 'investing' ? '投資完了' : '投資を更新'}
          </GameButton>
        ) : null}
        {!isViewingPastSet && team.status === 'investment_submitted' ? (
          <GameButton disabled={busy} onClick={onProceedToEvent}>
            イベント画面へ進む
          </GameButton>
        ) : null}
        {!isViewingPastSet &&
        (team.status === 'waiting_event' || team.status === 'finished') ? (
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
