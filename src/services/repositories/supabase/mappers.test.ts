import { describe, expect, it } from 'vitest';
import type { GameSessionRow, SetResultRow, TeamRow } from '@/lib/supabaseClient';
import {
  mapGameSessionRow,
  mapGameSessionToRow,
  mapSetResultRow,
  mapTeamRow,
  mapTeamToInsert,
} from './mappers';

describe('supabase mappers', () => {
  it('maps game session row ↔ domain', () => {
    const row: GameSessionRow = {
      id: 'sess-1',
      session_set: 2,
      active_event_id: 'evt_03',
      active_event_set_number: 2,
      updated_at: '2025-05-18T00:00:00.000Z',
    };
    const domain = mapGameSessionRow(row);
    expect(domain.sessionSet).toBe(2);
    expect(domain.activeEventId).toBe('evt_03');

    const back = mapGameSessionToRow(domain);
    expect(back.id).toBe('sess-1');
    expect(back.session_set).toBe(2);
  });

  it('maps team row with investments and normalizes team code on insert', () => {
    const row: TeamRow = {
      id: 'team-1',
      team_name: '生涯',
      team_code: 'shogai',
      current_set: 1,
      current_asset: 500_000,
      total_debt: 50_000,
      net_asset: 450_000,
      status: 'waiting_event',
      pending_investments: [{ id: 'i1', sector: 'food', amount: 100_000 }],
      investment_submitted_at: '2025-05-18T01:00:00.000Z',
      borrowed_in_current_set: true,
      loan_application_amount: 80_000,
      loan_applied_at: '2025-05-18T01:30:00.000Z',
      updated_at: '2025-05-18T00:00:00.000Z',
    };

    const team = mapTeamRow(row);
    expect(team.status).toBe('waiting_event');
    expect(team.pendingInvestments).toHaveLength(1);

    const insert = mapTeamToInsert({
      ...team,
      teamCode: '  Shogai  ',
      currentAsset: 600_000,
      totalDebt: 0,
    });
    expect(insert.team_code).toBe('shogai');
    expect(insert.net_asset).toBe(600_000);
  });

  it('falls back unknown team status to investing', () => {
    const row: TeamRow = {
      id: 't',
      team_name: 'x',
      team_code: 'x',
      current_set: 1,
      current_asset: 0,
      total_debt: 0,
      net_asset: 0,
      status: 'invalid_status',
      pending_investments: null,
      investment_submitted_at: null,
      borrowed_in_current_set: false,
      loan_application_amount: null,
      loan_applied_at: null,
      updated_at: '2025-05-18T00:00:00.000Z',
    };
    expect(mapTeamRow(row).status).toBe('investing');
  });

  it('maps set result row', () => {
    const row: SetResultRow = {
      id: 'sr-1',
      team_id: 'team-1',
      set_number: 1,
      starting_asset: 500_000,
      investments: [{ id: 'i1', sector: 'food', amount: 100_000 }],
      selected_event: 'evt_03',
      result_asset: 550_000,
      borrowed_amount: 0,
      debt_added: 0,
      completed_at: '2025-05-18T02:00:00.000Z',
    };
    const result = mapSetResultRow(row);
    expect(result.setNumber).toBe(1);
    expect(result.investments[0]?.amount).toBe(100_000);
  });
});
