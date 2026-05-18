import {
  BORROW_ASSET_CREDIT,
  BORROW_ASSET_THRESHOLD,
  BORROW_DEBT_RECORD,
  INVESTMENT_UNIT,
} from '@/constants';
import type { InvestmentLine, Result, ValidationError } from '@/types/domain';

function err(code: ValidationError['code'], message: string): Result<never> {
  return { ok: false, error: { code, message } };
}

export function validateCurrentAsset(amount: number): Result<number> {
  if (!Number.isFinite(amount) || amount < 0) {
    return err('INVALID_AMOUNT', '現在資産は 0 以上の数値で入力してください');
  }
  return { ok: true, value: amount };
}

export function validateInvestmentAmount(amount: number): Result<number> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return err('INVALID_AMOUNT', '投資金額は 0 より大きい必要があります');
  }
  if (amount % INVESTMENT_UNIT !== 0) {
    return err('INVALID_UNIT', `投資金額は ${INVESTMENT_UNIT.toLocaleString('ja-JP')}P 単位で入力してください`);
  }
  return { ok: true, value: amount };
}

export function validateInvestmentTotal(
  totalInvested: number,
  currentAsset: number,
): Result<number> {
  if (totalInvested > currentAsset) {
    return err('EXCEEDS_ASSET', '投資合計が現在資産を超えています');
  }
  return { ok: true, value: totalInvested };
}

export function sumInvestments(investments: readonly InvestmentLine[]): number {
  return investments.reduce((sum, line) => sum + line.amount, 0);
}

export function canBorrow(
  currentAsset: number,
  borrowedInCurrentSet: boolean,
): boolean {
  if (borrowedInCurrentSet) {
    return false;
  }
  return currentAsset < BORROW_ASSET_THRESHOLD;
}

export function applyBorrow(
  currentAsset: number,
  totalDebt: number,
): { currentAsset: number; totalDebt: number } {
  return {
    currentAsset: currentAsset + BORROW_ASSET_CREDIT,
    totalDebt: totalDebt + BORROW_DEBT_RECORD,
  };
}

export function tryBorrow(
  currentAsset: number,
  totalDebt: number,
  borrowedInCurrentSet: boolean,
): Result<{ currentAsset: number; totalDebt: number }> {
  if (borrowedInCurrentSet) {
    return err('BORROW_ALREADY_USED', 'この SET ではすでに借入済みです');
  }
  if (currentAsset >= BORROW_ASSET_THRESHOLD) {
    return err(
      'BORROW_NOT_ALLOWED',
      `現在資産が ${BORROW_ASSET_THRESHOLD.toLocaleString('ja-JP')}P 未満のときのみ借入できます`,
    );
  }
  return { ok: true, value: applyBorrow(currentAsset, totalDebt) };
}

export function computeNetAsset(
  currentAsset: number,
  totalDebt: number,
): number {
  return currentAsset - totalDebt;
}

export function computeFinalAsset(
  currentAsset: number,
  totalDebt: number,
): number {
  return computeNetAsset(currentAsset, totalDebt);
}
