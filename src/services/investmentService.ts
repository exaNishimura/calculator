import type { InvestmentLine, Result, TeamStatus, ValidationError } from '@/types/domain';
import {
  sumInvestments,
  validateInvestmentAmount,
  validateInvestmentTotal,
} from '@/utils/validation';
import { isInvestmentEditable, type TeamDraft } from './types';

function validationError(
  code: ValidationError['code'],
  message: string,
): Result<never> {
  return { ok: false, error: { code, message } };
}

export function isEditable(status: TeamStatus): boolean {
  return isInvestmentEditable(status);
}

export function getRemainingBudget(
  draft: TeamDraft,
  assetCap?: number,
): number {
  const cap = assetCap ?? draft.team.currentAsset;
  return cap - sumInvestments(draft.investments);
}

export interface InvestmentEditOptions {
  assetCap?: number;
  forceEditable?: boolean;
}

export function addInvestment(
  draft: TeamDraft,
  line: Omit<InvestmentLine, 'id'>,
  options?: InvestmentEditOptions,
): Result<TeamDraft> {
  if (!options?.forceEditable && !isEditable(draft.team.status)) {
    return validationError(
      'INVALID_AMOUNT',
      '投資の編集は SET 確定前まで可能です',
    );
  }

  const amountResult = validateInvestmentAmount(line.amount);
  if (!amountResult.ok) {
    return amountResult;
  }

  const assetCap = options?.assetCap ?? draft.team.currentAsset;
  const nextInvestments: InvestmentLine[] = [
    ...draft.investments,
    { ...line, id: crypto.randomUUID() },
  ];
  const total = sumInvestments(nextInvestments);
  const totalResult = validateInvestmentTotal(total, assetCap);
  if (!totalResult.ok) {
    return totalResult;
  }

  return {
    ok: true,
    value: { ...draft, investments: nextInvestments },
  };
}

export function removeInvestment(
  draft: TeamDraft,
  lineId: string,
  options?: Pick<InvestmentEditOptions, 'forceEditable'>,
): TeamDraft {
  if (!options?.forceEditable && !isEditable(draft.team.status)) {
    return draft;
  }

  return {
    ...draft,
    investments: draft.investments.filter((line) => line.id !== lineId),
  };
}
