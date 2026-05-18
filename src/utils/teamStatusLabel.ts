import type { TeamStatus } from '@/types/domain';

const STATUS_LABELS: Record<TeamStatus, string> = {
  not_started: '未開始',
  investing: '投資入力中',
  investment_submitted: '投資完了',
  waiting_event: 'イベント待ち',
  completed_set: 'SET完了',
  finished: '終了',
};

export function toTeamStatusLabel(status: TeamStatus): string {
  return STATUS_LABELS[status];
}
