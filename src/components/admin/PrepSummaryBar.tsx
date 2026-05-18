import type { PreparationSummary } from '@/services/types';
import { Card } from '@/components/ui';

interface PrepSummaryBarProps {
  summary: PreparationSummary;
  activeEventName: string | null;
}

export function PrepSummaryBar({
  summary,
  activeEventName,
}: PrepSummaryBarProps) {
  return (
    <Card data-testid="prep-summary-bar" className="!p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-bold text-white">
          SET{summary.currentSet} 投資完了 {summary.investmentSubmittedCount} /{' '}
          {summary.totalTeams} チーム
        </p>
        <p className="text-sm text-game-muted">
          確定イベント:{' '}
          <span className="font-semibold text-white">
            {activeEventName ?? '未発表'}
          </span>
        </p>
      </div>
    </Card>
  );
}
