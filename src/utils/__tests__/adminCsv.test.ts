import { describe, expect, it } from 'vitest';
import type { Team } from '@/types/domain';
import { rankTeams } from '@/services';
import { buildAdminTeamsCsv } from '../adminCsv';

const sampleTeam: Team = {
  id: 't1',
  teamName: 'テスト',
  teamCode: 'test',
  currentSet: 1,
  currentAsset: 100_000,
  totalDebt: 0,
  netAsset: 100_000,
  status: 'investing',
  pendingInvestments: null,
  investmentSubmittedAt: null,
  borrowedInCurrentSet: false,
  loanApplicationAmount: null,
  loanAppliedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('buildAdminTeamsCsv', () => {
  it('includes header and team row with BOM', () => {
    const ranked = rankTeams([sampleTeam]);
    const csv = buildAdminTeamsCsv(ranked, {
      id: 's1',
      sessionSet: 1,
      activeEventId: 'evt_01',
      activeEventSetNumber: 1,
      updatedAt: '2026-01-02T12:00:00.000Z',
    });
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('チーム名');
    expect(csv).toContain('テスト');
    expect(csv).toContain('F1開催効果');
    expect(csv).toContain('入力中');
  });
});
