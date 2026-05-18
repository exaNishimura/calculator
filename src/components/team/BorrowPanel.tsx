import { Link } from 'react-router-dom';
import type { Team } from '@/types/domain';
import {
  BORROW_ASSET_CREDIT,
  BORROW_ASSET_THRESHOLD,
  BORROW_DEBT_RECORD,
} from '@/constants';
import { Card, WarningAlert } from '@/components/ui';
import { canBorrow } from '@/services';

interface BorrowPanelProps {
  team: Team;
  editable: boolean;
}

export function BorrowPanel({ team, editable }: BorrowPanelProps) {
  const borrowable = editable && canBorrow(team);

  if (team.currentAsset >= BORROW_ASSET_THRESHOLD && !team.borrowedInCurrentSet) {
    return null;
  }

  return (
    <Card data-testid="borrow-panel">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-game-muted">
        借入（草愛銀行）
      </h2>
      {team.totalDebt > 0 ? (
        <WarningAlert title="借入中">
          借入総額 {team.totalDebt.toLocaleString('ja-JP')}P（この SET の返済はゲーム終了後）
        </WarningAlert>
      ) : null}
      {editable ? (
        <p className="mt-2 text-sm text-game-muted">
          現在資産が {BORROW_ASSET_THRESHOLD.toLocaleString('ja-JP')}P 未満のとき、1 SET
          に1回だけ借入できます（+{BORROW_ASSET_CREDIT.toLocaleString('ja-JP')}P /
          負債 +{BORROW_DEBT_RECORD.toLocaleString('ja-JP')}P）。お申込みは草愛銀行のWebサイトから。
        </p>
      ) : null}
      {borrowable ? (
        <Link
          to={`/bank/apply/${team.teamCode}`}
          className="mt-3 block rounded-xl border-2 border-game-warning bg-game-warning/15 px-4 py-4 text-center font-bold text-game-warning"
          data-testid="kusai-bank-link"
        >
          草愛銀行で融資を申し込む →
        </Link>
      ) : team.borrowedInCurrentSet ? (
        <p className="mt-2 text-sm text-game-muted">この SET は借入済みです。</p>
      ) : null}
    </Card>
  );
}
