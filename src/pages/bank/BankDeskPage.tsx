import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BankManagementSummary,
  BankShell,
  LoanApplicationTable,
} from '@/components/bank';
import { useAuth } from '@/context/AuthContext';
import { buildLoanDeskRows, summarizeBankPortfolio } from '@/services';
import { useGameStore } from '@/stores';

export function BankDeskPage() {
  const navigate = useNavigate();
  const { logoutBank } = useAuth();
  const teams = useGameStore((state) => state.teams);
  const loading = useGameStore((state) => state.loading);
  const reload = useGameStore((state) => state.reload);

  const summary = useMemo(() => summarizeBankPortfolio(teams), [teams]);
  const rows = useMemo(() => buildLoanDeskRows(teams), [teams]);

  const handleLogout = () => {
    logoutBank();
    navigate('/bank/desk/login');
  };

  return (
    <BankShell title="融資管理画面（行員専用）">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-800">
            各チームの借入総額・融資申込をリアルタイム監視（たぶん）
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="bank-btn-cheesy text-sm"
              onClick={() => void reload()}
            >
              最新に更新
            </button>
            <button
              type="button"
              className="border-2 border-gray-600 bg-white px-4 py-2 text-sm font-bold"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        </div>

        <BankManagementSummary summary={summary} />

        <div className="bank-frame space-y-3 p-4">
          <h2 className="border-b-2 border-blue-800 pb-1 text-lg font-black text-blue-900">
            チーム別 借入・申込一覧
          </h2>
          <p className="text-xs text-gray-700">
            借入総額の多い順に表示。借入ありの行は黄色で強調。
          </p>
          {loading && teams.length === 0 ? (
            <p>読み込み中…</p>
          ) : (
            <LoanApplicationTable rows={rows} />
          )}
        </div>
      </div>
    </BankShell>
  );
}
