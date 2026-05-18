import { describe, expect, it } from 'vitest';
import { getEventById } from '@/constants';
import type { InvestmentLine } from '@/types/domain';
import {
  calculateBonusLine,
  calculateSetResult,
  calculateStandardLine,
} from '@/utils/calculator';

describe('calculateStandardLine', () => {
  it('calculates 農業 50,000P with かぶせ茶 +80% as 90,000P', () => {
    const event = getEventById('evt_03');
    expect(event?.kind).toBe('standard');
    if (event?.kind !== 'standard') return;

    const line = calculateStandardLine(50_000, event.rates.agriculture);
    expect(line.result).toBe(90_000);
    expect(line.delta).toBe(40_000);
  });
});

describe('calculateBonusLine', () => {
  it('multiplies invested amount by sector multiplier', () => {
    const line = calculateBonusLine(50_000, 5);
    expect(line.result).toBe(250_000);
    expect(line.delta).toBe(200_000);
  });
});

describe('calculateSetResult', () => {
  const investments: InvestmentLine[] = [
    { id: '1', sector: 'agriculture', amount: 50_000 },
  ];

  it('includes uninvested carry in set ending asset', () => {
    const result = calculateSetResult({
      currentAsset: 200_000,
      investments,
      eventId: 'evt_03',
    });

    expect(result.uninvestedCarry).toBe(150_000);
    expect(result.setEndingAsset).toBe(240_000);
    expect(result.lines[0]?.result).toBe(90_000);
  });

  it('calculates BONUS event with multipliers only', () => {
    const result = calculateSetResult({
      currentAsset: 100_000,
      investments: [{ id: '1', sector: 'manufacturing', amount: 50_000 }],
      eventId: 'bonus_demand',
    });

    expect(result.lines[0]?.result).toBe(250_000);
    expect(result.setEndingAsset).toBe(50_000 + 250_000);
  });

  it('returns empty lines and full carry when no investments', () => {
    const result = calculateSetResult({
      currentAsset: 100_000,
      investments: [],
      eventId: 'evt_01',
    });

    expect(result.lines).toHaveLength(0);
    expect(result.uninvestedCarry).toBe(100_000);
    expect(result.setEndingAsset).toBe(100_000);
  });
});
