import type { Json } from '@/lib/supabaseClient';
import type {
  EventId,
  GameSession,
  InvestmentLine,
  SetResult,
  Team,
  TeamStatus,
} from '@/types/domain';
import type {
  GameSessionRow,
  SetResultRow,
  TeamInsert,
  TeamRow,
} from '@/lib/supabaseClient';
import { computeNetAsset } from '@/utils/validation';

const TEAM_STATUSES = new Set<TeamStatus>([
  'not_started',
  'investing',
  'investment_submitted',
  'waiting_event',
  'completed_set',
  'finished',
]);

function asTeamStatus(value: string): TeamStatus {
  if (TEAM_STATUSES.has(value as TeamStatus)) {
    return value as TeamStatus;
  }
  return 'investing';
}

function parseInvestments(value: unknown): InvestmentLine[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value as InvestmentLine[];
}

export function mapGameSessionRow(row: GameSessionRow): GameSession {
  return {
    id: row.id,
    sessionSet: row.session_set,
    activeEventId: row.active_event_id as EventId | null,
    activeEventSetNumber: row.active_event_set_number,
    updatedAt: row.updated_at,
  };
}

export function mapGameSessionToRow(session: GameSession): GameSessionRow {
  return {
    id: session.id,
    session_set: session.sessionSet,
    active_event_id: session.activeEventId,
    active_event_set_number: session.activeEventSetNumber,
    updated_at: session.updatedAt,
  };
}

export function mapTeamRow(row: TeamRow): Team {
  return {
    id: row.id,
    teamName: row.team_name,
    teamCode: row.team_code,
    currentSet: row.current_set,
    currentAsset: row.current_asset,
    totalDebt: row.total_debt,
    netAsset: row.net_asset,
    status: asTeamStatus(row.status),
    pendingInvestments: parseInvestments(row.pending_investments),
    investmentSubmittedAt: row.investment_submitted_at,
    borrowedInCurrentSet: row.borrowed_in_current_set,
    loanApplicationAmount: row.loan_application_amount ?? null,
    loanAppliedAt: row.loan_applied_at ?? null,
    updatedAt: row.updated_at,
  };
}

export function mapTeamToInsert(team: Team): TeamInsert {
  const updatedAt = new Date().toISOString();
  return {
    id: team.id,
    team_name: team.teamName,
    team_code: team.teamCode.trim().toLowerCase(),
    current_set: team.currentSet,
    current_asset: team.currentAsset,
    total_debt: team.totalDebt,
    net_asset: computeNetAsset(team.currentAsset, team.totalDebt),
    status: team.status,
    pending_investments: team.pendingInvestments as unknown as Json,
    investment_submitted_at: team.investmentSubmittedAt,
    borrowed_in_current_set: team.borrowedInCurrentSet,
    loan_application_amount: team.loanApplicationAmount,
    loan_applied_at: team.loanAppliedAt,
    updated_at: updatedAt,
  };
}

export function mapSetResultRow(row: SetResultRow): SetResult {
  return {
    id: row.id,
    teamId: row.team_id,
    setNumber: row.set_number,
    startingAsset: row.starting_asset,
    investments: parseInvestments(row.investments) ?? [],
    selectedEvent: row.selected_event as EventId,
    resultAsset: row.result_asset,
    borrowedAmount: row.borrowed_amount,
    debtAdded: row.debt_added,
    completedAt: row.completed_at,
  };
}

export function mapSetResultToRow(result: SetResult) {
  return {
    id: result.id,
    team_id: result.teamId,
    set_number: result.setNumber,
    starting_asset: result.startingAsset,
    investments: result.investments as unknown as Json,
    selected_event: result.selectedEvent,
    result_asset: result.resultAsset,
    borrowed_amount: result.borrowedAmount,
    debt_added: result.debtAdded,
    completed_at: result.completedAt || new Date().toISOString(),
  };
}
