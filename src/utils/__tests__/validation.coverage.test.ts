import { describe, expect, it } from 'vitest';
import {
  BORROW_ASSET_CREDIT,
  BORROW_ASSET_THRESHOLD,
  BORROW_DEBT_RECORD,
} from '@/constants';
import {
  applyBorrow,
  canBorrow,
  computeFinalAsset,
  computeNetAsset,
  tryBorrow,
  validateInvestmentAmount,
} from '@/utils/validation';

describe('borrow threshold boundaries', () => {
  it('allows borrow at 9,999P', () => {
    expect(canBorrow(9_999, false)).toBe(true);
    const result = tryBorrow(9_999, 0, false);
    expect(result.ok).toBe(true);
  });

  it('rejects borrow at exactly 10,000P', () => {
    expect(canBorrow(10_000, false)).toBe(false);
    const result = tryBorrow(10_000, 0, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BORROW_NOT_ALLOWED');
    }
  });

  it('rejects borrow at 10,001P and above', () => {
    expect(canBorrow(10_001, false)).toBe(false);
  });
});

describe('borrow amounts', () => {
  it('adds exactly 80,000P credit and 100,000P debt per borrow', () => {
    const first = applyBorrow(5_000, 0);
    expect(first.currentAsset).toBe(5_000 + BORROW_ASSET_CREDIT);
    expect(first.totalDebt).toBe(BORROW_DEBT_RECORD);

    const second = applyBorrow(first.currentAsset, first.totalDebt);
    expect(second.currentAsset).toBe(first.currentAsset + BORROW_ASSET_CREDIT);
    expect(second.totalDebt).toBe(BORROW_DEBT_RECORD * 2);
  });

  it('tryBorrow returns BORROW_ALREADY_USED when flag is set', () => {
    const result = tryBorrow(1_000, 100_000, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BORROW_ALREADY_USED');
    }
  });
});

describe('final asset after SET06', () => {
  it('computes final asset as current asset minus total debt', () => {
    expect(computeFinalAsset(320_000, 100_000)).toBe(220_000);
    expect(computeFinalAsset(320_000, 200_000)).toBe(120_000);
  });

  it('allows negative net asset when debt exceeds current asset', () => {
    expect(computeNetAsset(50_000, 100_000)).toBe(-50_000);
    expect(computeFinalAsset(50_000, 100_000)).toBe(-50_000);
  });

  it('simulates SET06 settlement after two borrows', () => {
    let currentAsset = 8_000;
    let totalDebt = 0;

    const borrow1 = tryBorrow(currentAsset, totalDebt, false);
    expect(borrow1.ok).toBe(true);
    if (borrow1.ok) {
      currentAsset = borrow1.value.currentAsset;
      totalDebt = borrow1.value.totalDebt;
    }

    expect(currentAsset).toBe(8_000 + BORROW_ASSET_CREDIT);
    expect(totalDebt).toBe(BORROW_DEBT_RECORD);

    const borrow2 = tryBorrow(5_000, totalDebt, true);
    expect(borrow2.ok).toBe(false);

    currentAsset = 180_000;
    expect(computeFinalAsset(currentAsset, totalDebt)).toBe(
      currentAsset - BORROW_DEBT_RECORD,
    );
  });
});

describe('investment unit boundaries', () => {
  it('accepts minimum valid investment 10,000P', () => {
    expect(validateInvestmentAmount(10_000).ok).toBe(true);
  });

  it('rejects 9,999P as invalid unit', () => {
    expect(validateInvestmentAmount(9_999).ok).toBe(false);
  });

  it('rejects amount one unit below threshold for borrow eligibility', () => {
    expect(canBorrow(BORROW_ASSET_THRESHOLD - 1, false)).toBe(true);
    expect(canBorrow(BORROW_ASSET_THRESHOLD, false)).toBe(false);
  });
});
