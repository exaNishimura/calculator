import {
  STANDARD_EVENT_IDS,
  type BonusEventDefinition,
  type EventDefinition,
  type EventId,
  type SectorRates,
  type StandardEventDefinition,
  type StandardEventId,
} from '@/types/domain';

function rates(
  manufacturing: number,
  agriculture: number,
  food: number,
  construction: number,
  tourism: number,
  childcare: number,
  it: number,
): SectorRates {
  return {
    manufacturing,
    agriculture,
    food,
    construction,
    tourism,
    childcare,
    it,
  };
}

export const STANDARD_EVENTS: readonly StandardEventDefinition[] = [
  {
    id: 'evt_01',
    number: 1,
    name: 'F1開催効果',
    kind: 'standard',
    rates: rates(0.6, 0, 0.8, 0.1, 1, 0.2, -0.2),
  },
  {
    id: 'evt_02',
    number: 2,
    name: '若者流出',
    kind: 'standard',
    rates: rates(-0.3, 0, -0.2, -0.8, -0.2, -0.8, -0.4),
  },
  {
    id: 'evt_03',
    number: 3,
    name: 'かぶせ茶ヒット',
    kind: 'standard',
    rates: rates(0.1, 0.8, 0.2, 0.1, 0.2, 0.2, -0.2),
  },
  {
    id: 'evt_04',
    number: 4,
    name: '工場トラブル',
    kind: 'standard',
    rates: rates(-0.6, 0, -0.6, 0.1, 0.1, -0.1, -0.2),
  },
  {
    id: 'evt_05',
    number: 5,
    name: 'トレンドスイーツ',
    kind: 'standard',
    rates: rates(0.1, 0.4, 1, 0.1, 0.4, 0, -0.2),
  },
  {
    id: 'evt_06',
    number: 6,
    name: '大型台風',
    kind: 'standard',
    rates: rates(0, -0.4, -0.4, 0.4, -0.2, 0.1, -0.2),
  },
  {
    id: 'evt_07',
    number: 7,
    name: '市民マラソン',
    kind: 'standard',
    rates: rates(0.1, 0, 0.3, 0.1, 0.8, 0.2, -0.2),
  },
  {
    id: 'evt_08',
    number: 8,
    name: '東南海地震',
    kind: 'standard',
    rates: rates(-0.8, -1, -1, 1, -1, -0.4, 0.2),
  },
  {
    id: 'evt_09',
    number: 9,
    name: '北勢バイパス',
    kind: 'standard',
    rates: rates(0.6, 0.3, 0.3, 0.5, 0.3, 0.8, -0.2),
  },
  {
    id: 'evt_10',
    number: 10,
    name: '大型農業施設',
    kind: 'standard',
    rates: rates(0.1, 0.8, 0.2, 0.2, 0.8, 0.2, -0.2),
  },
  {
    id: 'evt_11',
    number: 11,
    name: '新型ミニバン',
    kind: 'standard',
    rates: rates(1, 0, 0.4, -0.3, 0.1, 0.3, -0.2),
  },
  {
    id: 'evt_12',
    number: 12,
    name: '音楽フェス',
    kind: 'standard',
    rates: rates(0, 0, 0.1, 0, -0.2, 0, -0.2),
  },
  {
    id: 'evt_13',
    number: 13,
    name: '新大学',
    kind: 'standard',
    rates: rates(0.4, 0.2, 0.4, 0.3, 0.2, 0.6, 0.4),
  },
  {
    id: 'evt_14',
    number: 14,
    name: 'F1開催地移転',
    kind: 'standard',
    rates: rates(0, 0, 0.1, -0.4, -0.6, -0.2, -0.2),
  },
  {
    id: 'evt_15',
    number: 15,
    name: '先端企業誘致',
    kind: 'standard',
    rates: rates(0.4, 0.2, 0.3, 0.1, 0.2, 0.4, 3),
  },
  {
    id: 'evt_16',
    number: 16,
    name: '地域ブランド',
    kind: 'standard',
    rates: rates(0.1, -0.3, 0.1, 0.1, 0.1, 0.1, -0.2),
  },
] as const;

export const BONUS_EVENT: BonusEventDefinition = {
  id: 'bonus_demand',
  name: '特需発生',
  kind: 'bonus',
  multipliers: rates(5, 3, 4, 1, 2, 4, 3),
};

const standardEventMap = Object.fromEntries(
  STANDARD_EVENTS.map((event) => [event.id, event]),
) as Record<StandardEventId, StandardEventDefinition>;

const ALL_EVENT_IDS: readonly EventId[] = [
  ...STANDARD_EVENT_IDS,
  BONUS_EVENT.id,
];

export function getEventById(id: EventId): EventDefinition | undefined {
  if (id === BONUS_EVENT.id) {
    return BONUS_EVENT;
  }
  return standardEventMap[id as StandardEventId];
}

export function isEventId(value: string): value is EventId {
  return (ALL_EVENT_IDS as readonly string[]).includes(value);
}

export const ALL_EVENTS: readonly EventDefinition[] = [
  ...STANDARD_EVENTS,
  BONUS_EVENT,
];
