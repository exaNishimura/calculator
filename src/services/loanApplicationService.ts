import { BORROW_ASSET_CREDIT } from '@/constants';
import type { Result, Team } from '@/types/domain';
import { canBorrow, executeBorrow } from './borrowingService';

/** 草愛銀行の定番融資商品（ゲームルール準拠） */
export const KUSAI_LOAN_PRODUCT_AMOUNT = BORROW_ASSET_CREDIT;

export function recordLoanApplication(team: Team): Result<Team> {
  if (!canBorrow(team)) {
    return {
      ok: false,
      error: {
        code: 'BORROW_NOT_ALLOWED',
        message:
          '現在、融資のお申込みは受け付けておりません（資産条件・進行状況をご確認ください）',
      },
    };
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    value: {
      ...team,
      loanApplicationAmount: KUSAI_LOAN_PRODUCT_AMOUNT,
      loanAppliedAt: now,
    },
  };
}

/** 申込記録のあと、即時融資実行（草愛銀行スタイル） */
export function applyLoanViaBank(team: Team): Result<Team> {
  const borrowed = executeBorrow(team);
  if (!borrowed.ok) {
    return borrowed;
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    value: {
      ...borrowed.value,
      loanApplicationAmount: KUSAI_LOAN_PRODUCT_AMOUNT,
      loanAppliedAt: now,
    },
  };
}

export type LoanDeskRow = {
  team: Team;
  applicationLabel: string;
  statusLabel: string;
  statusTone: 'muted' | 'pending' | 'done';
};

export type BankPortfolioSummary = {
  teamCount: number;
  totalDebt: number;
  teamsWithDebt: number;
  applicationCount: number;
  totalApplicationAmount: number;
  totalCurrentAsset: number;
  totalNetAsset: number;
};

export function summarizeBankPortfolio(teams: Team[]): BankPortfolioSummary {
  return {
    teamCount: teams.length,
    totalDebt: teams.reduce((sum, team) => sum + team.totalDebt, 0),
    teamsWithDebt: teams.filter((team) => team.totalDebt > 0).length,
    applicationCount: teams.filter((team) => team.loanApplicationAmount != null)
      .length,
    totalApplicationAmount: teams.reduce(
      (sum, team) => sum + (team.loanApplicationAmount ?? 0),
      0,
    ),
    totalCurrentAsset: teams.reduce((sum, team) => sum + team.currentAsset, 0),
    totalNetAsset: teams.reduce((sum, team) => sum + team.netAsset, 0),
  };
}

export function buildLoanDeskRows(teams: Team[]): LoanDeskRow[] {
  const sorted = [...teams].sort((a, b) => b.totalDebt - a.totalDebt);

  return sorted.map((team) => {
    if (team.borrowedInCurrentSet) {
      return {
        team,
        applicationLabel:
          team.loanApplicationAmount != null
            ? `${team.loanApplicationAmount.toLocaleString('ja-JP')}P`
            : `${KUSAI_LOAN_PRODUCT_AMOUNT.toLocaleString('ja-JP')}P`,
        statusLabel: '融資実行済',
        statusTone: 'done',
      };
    }

    if (team.loanApplicationAmount != null) {
      return {
        team,
        applicationLabel: `${team.loanApplicationAmount.toLocaleString('ja-JP')}P`,
        statusLabel: '申込受付（未実行）',
        statusTone: 'pending',
      };
    }

    return {
      team,
      applicationLabel: '—',
      statusLabel: canBorrow(team) ? '申込可能' : '対象外',
      statusTone: 'muted',
    };
  });
}
