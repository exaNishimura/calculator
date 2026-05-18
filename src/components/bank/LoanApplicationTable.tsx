import type { LoanDeskRow } from '@/services/loanApplicationService';

interface LoanApplicationTableProps {
  rows: LoanDeskRow[];
}

const statusClass: Record<LoanDeskRow['statusTone'], string> = {
  muted: 'text-gray-600',
  pending: 'font-bold text-orange-700',
  done: 'font-bold text-green-800',
};

export function LoanApplicationTable({ rows }: LoanApplicationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[640px] border-collapse border-2 border-gray-600 text-sm"
        data-testid="loan-application-table"
      >
        <thead>
          <tr className="bg-blue-800 text-left text-white">
            <th className="border border-blue-900 px-2 py-2">チーム</th>
            <th className="border border-blue-900 px-2 py-2">SET</th>
            <th className="border border-blue-900 px-2 py-2 text-right">現在資産</th>
            <th className="border border-blue-900 px-2 py-2 text-right font-black">
              借入総額
            </th>
            <th className="border border-blue-900 px-2 py-2 text-right">実質資産</th>
            <th className="border border-blue-900 px-2 py-2 text-right">申込金額</th>
            <th className="border border-blue-900 px-2 py-2">申込日時</th>
            <th className="border border-blue-900 px-2 py-2">状況</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, applicationLabel, statusLabel, statusTone }) => (
            <tr
              key={team.id}
              className={
                team.totalDebt > 0
                  ? 'bg-yellow-200 font-semibold'
                  : 'odd:bg-white even:bg-yellow-50'
              }
              data-testid={team.totalDebt > 0 ? 'bank-row-with-debt' : undefined}
            >
              <td className="border border-gray-400 px-2 py-2 font-semibold">
                {team.teamName}
                <span className="ml-1 font-mono text-xs text-gray-500">
                  ({team.teamCode})
                </span>
              </td>
              <td className="border border-gray-400 px-2 py-2">SET{team.currentSet}</td>
              <td className="border border-gray-400 px-2 py-2 text-right font-mono">
                {team.currentAsset.toLocaleString('ja-JP')}P
              </td>
              <td className="border border-gray-400 px-2 py-2 text-right font-mono text-lg font-black text-red-700">
                {team.totalDebt.toLocaleString('ja-JP')}P
              </td>
              <td className="border border-gray-400 px-2 py-2 text-right font-mono">
                {team.netAsset.toLocaleString('ja-JP')}P
              </td>
              <td className="border border-gray-400 px-2 py-2 text-right font-mono font-bold text-orange-700">
                {applicationLabel}
              </td>
              <td className="border border-gray-400 px-2 py-2 text-xs">
                {team.loanAppliedAt
                  ? new Date(team.loanAppliedAt).toLocaleString('ja-JP')
                  : '—'}
              </td>
              <td
                className={`border border-gray-400 px-2 py-2 ${statusClass[statusTone]}`}
              >
                {statusLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
