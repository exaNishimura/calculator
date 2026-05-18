import { getEventById } from '@/constants';
import type {
  EventId,
  InvestmentLine,
  InvestmentLineResult,
  Result,
  SetCalculationResult,
} from '@/types/domain';

export interface LineAmounts {
  result: number;
  delta: number;
}

export function calculateStandardLine(
  invested: number,
  rate: number,
): LineAmounts {
  const result = Math.round(invested * (1 + rate));
  return { result, delta: result - invested };
}

export function calculateBonusLine(
  invested: number,
  multiplier: number,
): LineAmounts {
  const result = Math.round(invested * multiplier);
  return { result, delta: result - invested };
}

export interface CalculateSetResultInput {
  currentAsset: number;
  investments: readonly InvestmentLine[];
  eventId: EventId;
}

export function calculateSetResult(
  input: CalculateSetResultInput,
): SetCalculationResult {
  const event = getEventById(input.eventId);
  if (!event) {
    throw new Error(`Unknown event: ${input.eventId}`);
  }

  const totalInvested = input.investments.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const uninvestedCarry = input.currentAsset - totalInvested;

  const lines: InvestmentLineResult[] = input.investments.map((line) => {
    const amounts =
      event.kind === 'bonus'
        ? calculateBonusLine(line.amount, event.multipliers[line.sector])
        : calculateStandardLine(line.amount, event.rates[line.sector]);

    return {
      sector: line.sector,
      invested: line.amount,
      result: amounts.result,
      delta: amounts.delta,
    };
  });

  const investedResults = lines.reduce((sum, line) => sum + line.result, 0);

  return {
    lines,
    uninvestedCarry,
    setEndingAsset: uninvestedCarry + investedResults,
  };
}

export function calculateSetResultSafe(
  input: CalculateSetResultInput,
): Result<SetCalculationResult> {
  const event = getEventById(input.eventId);
  if (!event) {
    return {
      ok: false,
      error: {
        code: 'EVENT_NOT_ASSIGNED',
        message: 'イベントが割り当てられていません',
      },
    };
  }
  return { ok: true, value: calculateSetResult(input) };
}
