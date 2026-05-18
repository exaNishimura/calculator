import type { BankPortfolioSummary } from '@/services/loanApplicationService';

interface BankManagementSummaryProps {
  summary: BankPortfolioSummary;
}

function formatP(value: number): string {
  return `${value.toLocaleString('ja-JP')}P`;
}

export function BankManagementSummary({ summary }: BankManagementSummaryProps) {
  return (
    <section
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="bank-management-summary"
    >
      <article className="border-4 border-red-600 bg-red-50 p-4 text-center shadow-md">
        <p className="text-xs font-bold text-red-800">借入総額（全チーム合計）</p>
        <p
          className="mt-2 font-mono text-3xl font-black text-red-700 bank-blink"
          data-testid="bank-total-debt"
        >
          {formatP(summary.totalDebt)}
        </p>
        <p className="mt-1 text-[11px] text-red-900">
          {summary.teamsWithDebt} / {summary.teamCount} チームが借入中
        </p>
      </article>

      <article className="border-4 border-blue-700 bg-blue-50 p-4 text-center">
        <p className="text-xs font-bold text-blue-900">実質資産合計</p>
        <p className="mt-2 font-mono text-2xl font-black text-blue-800">
          {formatP(summary.totalNetAsset)}
        </p>
        <p className="mt-1 text-[11px] text-blue-900">
          現在資産 {formatP(summary.totalCurrentAsset)}
        </p>
      </article>

      <article className="border-4 border-orange-500 bg-orange-50 p-4 text-center">
        <p className="text-xs font-bold text-orange-900">融資申込（記録）</p>
        <p className="mt-2 font-mono text-2xl font-black text-orange-800">
          {formatP(summary.totalApplicationAmount)}
        </p>
        <p className="mt-1 text-[11px] text-orange-900">
          申込 {summary.applicationCount} 件
        </p>
      </article>

      <article className="border-4 border-green-700 bg-green-50 p-4 text-center">
        <p className="text-xs font-bold text-green-900">与信残枠（参考）</p>
        <p className="mt-2 font-mono text-2xl font-black text-green-800">
          ∞P
        </p>
        <p className="mt-1 text-[11px] text-green-900">
          ※ 当行の良心の上限は非公開です
        </p>
      </article>
    </section>
  );
}
