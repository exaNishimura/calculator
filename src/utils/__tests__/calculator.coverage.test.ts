import { describe, expect, it } from 'vitest';
import { BONUS_EVENT, STANDARD_EVENTS } from '@/constants';
import { SECTOR_IDS, type Sector } from '@/types/domain';
import {
  calculateBonusLine,
  calculateSetResult,
  calculateStandardLine,
} from '@/utils/calculator';

const BASE_INVESTMENT = 100_000;

describe('standard events — all 16 events × 7 sectors', () => {
  it.each(STANDARD_EVENTS.map((event) => [event.id, event.name, event] as const))(
    '%s (%s)',
    (_id, _name, event) => {
      expect(event.kind).toBe('standard');
      if (event.kind !== 'standard') return;

      for (const sector of SECTOR_IDS) {
        const rate = event.rates[sector];
        const expected = Math.round(BASE_INVESTMENT * (1 + rate));
        const { result, delta } = calculateStandardLine(BASE_INVESTMENT, rate);
        expect(result).toBe(expected);
        expect(delta).toBe(expected - BASE_INVESTMENT);
      }
    },
  );
});

describe('standard events — representative scenarios', () => {
  it('evt_08 東南海地震 applies -100% to agriculture as zero return', () => {
    const event = STANDARD_EVENTS.find((e) => e.id === 'evt_08');
    expect(event?.kind).toBe('standard');
    if (event?.kind !== 'standard') return;

    const { result } = calculateStandardLine(
      50_000,
      event.rates.agriculture,
    );
    expect(result).toBe(0);
  });

  it('evt_15 先端企業誘致 applies +300% to IT', () => {
    const event = STANDARD_EVENTS.find((e) => e.id === 'evt_15');
    expect(event?.kind).toBe('standard');
    if (event?.kind !== 'standard') return;

    const { result } = calculateStandardLine(10_000, event.rates.it);
    expect(result).toBe(40_000);
  });

  it('evt_01 F1開催効果 applies +100% to tourism', () => {
    const event = STANDARD_EVENTS.find((e) => e.id === 'evt_01');
    expect(event?.kind).toBe('standard');
    if (event?.kind !== 'standard') return;

    const { result } = calculateStandardLine(20_000, event.rates.tourism);
    expect(result).toBe(40_000);
  });
});

describe('BONUS 特需発生 — all sector multipliers', () => {
  it.each(
    SECTOR_IDS.map((sector) => [sector, BONUS_EVENT.multipliers[sector]] as const),
  )('sector %s × multiplier', (sector, multiplier) => {
    const { result, delta } = calculateBonusLine(BASE_INVESTMENT, multiplier);
    const expected = Math.round(BASE_INVESTMENT * multiplier);
    expect(result).toBe(expected);
    expect(delta).toBe(expected - BASE_INVESTMENT);
    expect(BONUS_EVENT.multipliers[sector as Sector]).toBe(multiplier);
  });

  it('calculateSetResult uses multipliers not rates for bonus_demand', () => {
    const result = calculateSetResult({
      currentAsset: 300_000,
      investments: SECTOR_IDS.map((sector, index) => ({
        id: String(index),
        sector,
        amount: 10_000,
      })),
      eventId: 'bonus_demand',
    });

    expect(result.lines).toHaveLength(7);
    result.lines.forEach((line) => {
      const multiplier = BONUS_EVENT.multipliers[line.sector];
      expect(line.result).toBe(Math.round(10_000 * multiplier));
    });
  });
});

describe('set ending asset aggregation', () => {
  it('sums multiple investment line results plus uninvested carry', () => {
    const result = calculateSetResult({
      currentAsset: 500_000,
      investments: [
        { id: '1', sector: 'agriculture', amount: 50_000 },
        { id: '2', sector: 'tourism', amount: 50_000 },
      ],
      eventId: 'evt_03',
    });

    const agricultureResult = Math.round(50_000 * 1.8);
    const tourismResult = Math.round(50_000 * 1.2);
    expect(result.uninvestedCarry).toBe(400_000);
    expect(result.setEndingAsset).toBe(
      400_000 + agricultureResult + tourismResult,
    );
  });
});
