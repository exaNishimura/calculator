import { describe, expect, it } from 'vitest';
import {
  BONUS_EVENT,
  BORROW_ASSET_CREDIT,
  BORROW_ASSET_THRESHOLD,
  BORROW_DEBT_RECORD,
  INVESTMENT_UNIT,
  SET_MAX,
  SECTORS,
  STANDARD_EVENTS,
  getEventById,
  getSectorLabel,
  isEventId,
  isSector,
} from '@/constants';

describe('game constants', () => {
  it('defines SET and investment unit', () => {
    expect(SET_MAX).toBe(6);
    expect(INVESTMENT_UNIT).toBe(10_000);
  });

  it('defines borrow amounts', () => {
    expect(BORROW_ASSET_THRESHOLD).toBe(10_000);
    expect(BORROW_ASSET_CREDIT).toBe(80_000);
    expect(BORROW_DEBT_RECORD).toBe(100_000);
  });
});

describe('sectors', () => {
  it('lists 7 investment sectors with Japanese labels', () => {
    expect(SECTORS).toHaveLength(7);
    expect(getSectorLabel('agriculture')).toBe('農業');
    expect(getSectorLabel('it')).toBe('IT');
  });

  it('validates sector ids', () => {
    expect(isSector('manufacturing')).toBe(true);
    expect(isSector('invalid')).toBe(false);
  });
});

describe('standard events', () => {
  it('defines 16 standard events with unique ids', () => {
    expect(STANDARD_EVENTS).toHaveLength(16);
    const ids = STANDARD_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(16);
    ids.forEach((id) => expect(isEventId(id)).toBe(true));
  });

  it('resolves event id to name uniquely', () => {
    const tea = getEventById('evt_03');
    expect(tea?.name).toBe('かぶせ茶ヒット');
    expect(tea?.kind).toBe('standard');
    if (tea?.kind === 'standard') {
      expect(tea.rates.agriculture).toBe(0.8);
    }
  });

  it('stores F1開催効果 tourism rate as +100%', () => {
    const evt = getEventById('evt_01');
    expect(evt?.kind).toBe('standard');
    if (evt?.kind === 'standard') {
      expect(evt.rates.tourism).toBe(1);
    }
  });

  it('stores 先端企業誘致 IT rate as +300%', () => {
    const evt = getEventById('evt_15');
    expect(evt?.kind).toBe('standard');
    if (evt?.kind === 'standard') {
      expect(evt.rates.it).toBe(3);
    }
  });
});

describe('bonus event', () => {
  it('defines 特需発生 with sector multipliers', () => {
    expect(BONUS_EVENT.id).toBe('bonus_demand');
    expect(BONUS_EVENT.name).toBe('特需発生');
    expect(BONUS_EVENT.multipliers.manufacturing).toBe(5);
    expect(BONUS_EVENT.multipliers.it).toBe(3);
    expect(BONUS_EVENT.multipliers.construction).toBe(1);
  });

  it('is retrievable via getEventById', () => {
    const bonus = getEventById('bonus_demand');
    expect(bonus?.kind).toBe('bonus');
  });
});
