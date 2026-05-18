import type { Team } from '@/types/domain';
import { AmountDisplay, Badge, Card } from '@/components/ui';
import { computeNetAsset } from '@/utils/validation';

interface AssetHeaderProps {
  team: Team;
  remainingBudget: number;
  showCurrentAsset?: boolean;
  viewingSetNumber?: number;
}

export function AssetHeader({
  team,
  remainingBudget,
  showCurrentAsset = true,
  viewingSetNumber,
}: AssetHeaderProps) {
  const netAsset = computeNetAsset(team.currentAsset, team.totalDebt);
  const setLabel = viewingSetNumber ?? team.currentSet;

  return (
    <Card data-testid="asset-header">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Badge>SET {setLabel}</Badge>
        {viewingSetNumber && viewingSetNumber !== team.currentSet ? (
          <Badge tone="warning">過去 SET を編集中</Badge>
        ) : null}
        {team.totalDebt > 0 ? (
          <Badge tone="warning">借入あり</Badge>
        ) : null}
      </header>
      <div
        className={`grid gap-4 ${showCurrentAsset ? 'sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        {showCurrentAsset ? (
          <AmountDisplay amount={team.currentAsset} label="現在資産" />
        ) : null}
        <AmountDisplay
          amount={remainingBudget}
          label="残り投資可能額"
          tone="profit"
        />
      </div>
      <footer className="mt-4 grid gap-3 border-t border-game-border pt-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-game-muted">借入総額</p>
          <p
            className={`text-2xl font-bold ${team.totalDebt > 0 ? 'text-game-warning' : 'text-white'}`}
          >
            {team.totalDebt.toLocaleString('ja-JP')}P
          </p>
        </div>
        <div>
          <p className="text-sm text-game-muted">実質資産</p>
          {team.totalDebt > 0 ? (
            <p className="text-xs text-game-muted">現在資産 − 借入総額</p>
          ) : null}
          <p className="text-2xl font-bold text-white">
            {netAsset.toLocaleString('ja-JP')}P
          </p>
        </div>
      </footer>
    </Card>
  );
}
