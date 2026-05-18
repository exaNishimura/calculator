import {
  isNotReadyForEvent,
  toPreparationLabel,
  type RankedTeam,
} from '@/services';
import { Badge } from '@/components/ui';
import { toTeamStatusLabel } from '@/utils/teamStatusLabel';

function rowHighlightClass(team: RankedTeam): string {
  const classes: string[] = [];
  if (isNotReadyForEvent(team)) {
    classes.push('border-l-4 border-game-warning bg-game-warning/5');
  } else if (team.status === 'waiting_event') {
    classes.push('border-l-4 border-game-accent bg-game-accent/5');
  }
  if (team.totalDebt > 0) {
    classes.push('ring-1 ring-inset ring-game-warning/40');
  }
  return classes.join(' ');
}

interface TeamLeaderboardTableProps {
  teams: RankedTeam[];
}

export function TeamLeaderboardTable({ teams }: TeamLeaderboardTableProps) {
  return (
    <div
      data-testid="team-leaderboard-table"
      className="overflow-x-auto rounded-2xl border border-game-border bg-game-surface"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-game-border bg-game-bg/60 text-game-muted">
          <tr>
            <th className="px-3 py-3 font-semibold">順位</th>
            <th className="px-3 py-3 font-semibold">チーム</th>
            <th className="px-3 py-3 font-semibold">SET</th>
            <th className="px-3 py-3 font-semibold text-right">現在資産</th>
            <th className="px-3 py-3 font-semibold text-right">借入総額</th>
            <th className="px-3 py-3 font-semibold text-right">実質資産</th>
            <th className="px-3 py-3 font-semibold">ステータス</th>
            <th className="px-3 py-3 font-semibold">準備状況</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr
              key={team.id}
              data-testid={`team-row-${team.teamCode}`}
              className={`border-b border-game-border/60 ${rowHighlightClass(team)}`}
            >
              <td className="px-3 py-3 font-bold text-white">{team.rank}</td>
              <td className="px-3 py-3">
                <p className="font-semibold text-white">{team.teamName}</p>
                {team.totalDebt > 0 ? (
                  <Badge tone="warning" className="mt-1">
                    借入あり
                  </Badge>
                ) : null}
              </td>
              <td className="px-3 py-3 text-white">SET{team.currentSet}</td>
              <td className="px-3 py-3 text-right font-mono text-white">
                {team.currentAsset.toLocaleString('ja-JP')}P
              </td>
              <td className="px-3 py-3 text-right font-mono text-game-warning">
                {team.totalDebt.toLocaleString('ja-JP')}P
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-game-profit">
                {team.netAsset.toLocaleString('ja-JP')}P
              </td>
              <td className="px-3 py-3 text-game-muted">
                {toTeamStatusLabel(team.status)}
              </td>
              <td className="px-3 py-3 text-white">
                {toPreparationLabel(team.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
