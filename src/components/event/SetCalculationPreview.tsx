import type { SetCalculationResult } from '@/types/domain';
import { getSectorLabel } from '@/constants/sectors';
import { AmountDisplay, Card } from '@/components/ui';

interface SetCalculationPreviewProps {
  result: SetCalculationResult;
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toLocaleString('ja-JP')}P`;
}

export function SetCalculationPreview({ result }: SetCalculationPreviewProps) {
  return (
    <Card data-testid="set-calculation-preview">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-game-muted">
        計算プレビュー
      </h2>
      {result.lines.length === 0 ? (
        <p className="text-sm text-game-muted">投資がありません</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {result.lines.map((line) => {
            const tone =
              line.delta > 0 ? 'text-game-profit' : line.delta < 0 ? 'text-game-loss' : 'text-game-muted';
            return (
              <li
                key={line.sector}
                className="rounded-xl border border-game-border bg-game-bg/50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    {getSectorLabel(line.sector)}
                  </p>
                  <p className={`text-sm font-bold ${tone}`}>
                    {formatDelta(line.delta)}
                  </p>
                </div>
                <div className="mt-1 flex justify-between text-sm text-game-muted">
                  <span>投資 {line.invested.toLocaleString('ja-JP')}P</span>
                  <span>結果 {line.result.toLocaleString('ja-JP')}P</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {result.uninvestedCarry > 0 ? (
        <p className="mb-4 text-sm text-game-muted">
          未投資持ち越し: {result.uninvestedCarry.toLocaleString('ja-JP')}P
        </p>
      ) : null}
      <AmountDisplay
        amount={result.setEndingAsset}
        label="SET 終了資産"
        tone="profit"
      />
    </Card>
  );
}
