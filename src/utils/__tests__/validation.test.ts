import { describe, expect, it } from 'vitest';
import {
  applyBorrow,
  canBorrow,
  computeFinalAsset,
  computeNetAsset,
  sumInvestments,
  validateInvestmentAmount,
  validateInvestmentTotal,
} from '@/utils/validation';

describe('validateInvestmentAmount', () => {
  it('accepts 10,000P multiples', () => {
    expect(validateInvestmentAmount(50_000).ok).toBe(true);
  });

  it('rejects non-unit amounts', () => {
    const result = validateInvestmentAmount(15_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_UNIT');
    }
  });

  it('rejects zero or negative', () => {
    expect(validateInvestmentAmount(0).ok).toBe(false);
  });
});

describe('validateInvestmentTotal', () => {
  it('rejects when total exceeds current asset', () => {
    const result = validateInvestmentTotal(120_000, 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EXCEEDS_ASSET');
    }
  });
});

describe('borrow rules', () => {
  it('allows borrow when asset below threshold', () => {
    expect(canBorrow(9_000, false)).toBe(true);
  });

  it('rejects borrow when asset at or above threshold', () => {
    expect(canBorrow(10_000, false)).toBe(false);
    expect(canBorrow(50_000, false)).toBe(false);
  });

  it('rejects second borrow in same SET', () => {
    expect(canBorrow(5_000, true)).toBe(false);
  });

  it('applies 80,000P credit and 100,000P debt record', () => {
    const next = applyBorrow(5_000, 0);
    expect(next.currentAsset).toBe(85_000);
    expect(next.totalDebt).toBe(100_000);
  });
});

describe('net and final asset', () => {
  it('computes net asset as current minus debt', () => {
    expect(computeNetAsset(500_000, 100_000)).toBe(400_000);
    expect(computeFinalAsset(500_000, 100_000)).toBe(400_000);
  });
});

describe('sumInvestments', () => {
  it('sums investment line amounts', () => {
    expect(
      sumInvestments([
        { id: '1', sector: 'agriculture', amount: 50_000 },
        { id: '2', sector: 'food', amount: 30_000 },
      ]),
    ).toBe(80_000);
  });
});
