import type { InvestmentLine } from '@/types/domain';
import { Card, GameButton } from '@/components/ui';
import { getSectorLabel } from '@/constants/sectors';
import type { Sector } from '@/types/domain';

interface InvestmentListProps {
  investments: InvestmentLine[];
  editable: boolean;
  onRemove: (lineId: string) => void;
}

export function InvestmentList({
  investments,
  editable,
  onRemove,
}: InvestmentListProps) {
  return (
    <Card data-testid="investment-list">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-game-muted">
        投資一覧
      </h2>
      {investments.length === 0 ? (
        <p className="text-sm text-game-muted">まだ投資がありません</p>
      ) : (
        <ul className="space-y-2">
          {investments.map((line) => (
            <li
              key={line.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-game-border bg-game-bg/50 px-3 py-2"
            >
              <div>
                <p className="font-semibold text-white">
                  {getSectorLabel(line.sector as Sector)}
                </p>
                <p className="text-sm text-game-muted">
                  {line.amount.toLocaleString('ja-JP')}P
                </p>
              </div>
              {editable ? (
                <GameButton
                  variant="danger"
                  fullWidth={false}
                  className="min-h-10 px-4 text-base"
                  onClick={() => onRemove(line.id)}
                >
                  削除
                </GameButton>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
