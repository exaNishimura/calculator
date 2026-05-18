import { Link } from 'react-router-dom';
import { GameButton } from '@/components/ui';

interface EventResultsActionBarProps {
  teamCode: string;
  busy: boolean;
  canConfirm: boolean;
  onConfirm: () => void;
}

export function EventResultsActionBar({
  teamCode,
  busy,
  canConfirm,
  onConfirm,
}: EventResultsActionBarProps) {
  return (
    <aside
      data-testid="event-results-action-bar"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-game-border bg-game-bg/95 px-4 py-4 backdrop-blur"
    >
      <section className="mx-auto flex w-full max-w-lg flex-col gap-2">
        <GameButton disabled={busy || !canConfirm} onClick={onConfirm}>
          計算を確定
        </GameButton>
        <Link
          to={`/team/${teamCode}`}
          className="block text-center text-sm text-game-muted underline"
        >
          投資画面に戻る
        </Link>
      </section>
    </aside>
  );
}
