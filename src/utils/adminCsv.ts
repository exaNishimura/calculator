import { getEventById } from '@/constants';
import type { GameSession } from '@/types/domain';
import {
  rankTeams,
  toPreparationLabel,
  type RankedTeam,
} from '@/services';
import type { Team } from '@/types/domain';

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  return new Date(iso).toLocaleString('ja-JP');
}

export function buildAdminTeamsCsv(
  teams: RankedTeam[],
  session: GameSession | null,
): string {
  const eventName =
    session?.activeEventId != null
      ? (getEventById(session.activeEventId)?.name ?? session.activeEventId)
      : '';
  const eventSet = session?.activeEventSetNumber ?? '';
  const eventAssignedAt =
    session?.activeEventId != null ? formatTimestamp(session.updatedAt) : '';

  const header = [
    'チーム名',
    'SET',
    '現在資産',
    '借入総額',
    '実質資産',
    '順位',
    'ステータス',
    '準備状況',
    '確定イベントSET',
    '確定イベント名',
    'イベント確定時刻',
  ];

  const rows = teams.map((team) => [
    team.teamName,
    team.currentSet,
    team.currentAsset,
    team.totalDebt,
    team.netAsset,
    team.rank,
    team.status,
    toPreparationLabel(team.status),
    eventSet,
    eventName,
    eventAssignedAt,
  ]);

  const lines = [header, ...rows].map((row) =>
    row.map(escapeCsvCell).join(','),
  );

  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportAdminTeamsCsv(
  teams: Team[],
  session: GameSession | null,
): void {
  const ranked = rankTeams(teams, teams.some((team) => team.status === 'finished'));
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadCsv(`game02-teams-${stamp}.csv`, buildAdminTeamsCsv(ranked, session));
}
