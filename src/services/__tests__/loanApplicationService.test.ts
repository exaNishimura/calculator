import { describe, expect, it } from 'vitest';
import {
  applyLoanViaBank,
  buildLoanDeskRows,
  KUSAI_LOAN_PRODUCT_AMOUNT,
  summarizeBankPortfolio,
} from '../loanApplicationService';

const base = {
  id: 't1',
  teamName: 'テスト',
  teamCode: 'test',
  currentSet: 1,
  currentAsset: 5_000,
  totalDebt: 0,
  netAsset: 5_000,
  status: 'investing' as const,
  pendingInvestments: null,
  investmentSubmittedAt: null,
  borrowedInCurrentSet: false,
  loanApplicationAmount: null,
  loanAppliedAt: null,
  updatedAt: new Date().toISOString(),
};

describe('loanApplicationService', () => {
  it('applyLoanViaBank records application amount and borrows', () => {
    const result = applyLoanViaBank(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.loanApplicationAmount).toBe(KUSAI_LOAN_PRODUCT_AMOUNT);
      expect(result.value.loanAppliedAt).toBeTruthy();
      expect(result.value.borrowedInCurrentSet).toBe(true);
      expect(result.value.currentAsset).toBeGreaterThan(base.currentAsset);
    }
  });

  it('summarizeBankPortfolio totals debt across teams', () => {
    const borrowed = applyLoanViaBank(base);
    const other = { ...base, id: 't2', teamCode: 'other', teamName: '他' };
    const summary = summarizeBankPortfolio([
      borrowed.ok ? borrowed.value : base,
      other,
    ]);
    expect(summary.totalDebt).toBeGreaterThan(0);
    expect(summary.teamsWithDebt).toBe(1);
  });

  it('buildLoanDeskRows labels applied teams', () => {
    const applied = applyLoanViaBank(base);
    if (!applied.ok) {
      throw new Error('setup failed');
    }
    const rows = buildLoanDeskRows([applied.value]);
    expect(rows[0]?.applicationLabel).toContain('80,000');
    expect(rows[0]?.statusLabel).toBe('融資実行済');
  });
});
