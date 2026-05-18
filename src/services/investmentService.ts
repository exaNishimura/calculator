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

export function getRemainingBudget(draft: TeamDraft): number {
  return draft.team.currentAsset - sumInvestments(draft.investments);
}

export function addInvestment(
  draft: TeamDraft,
  line: Omit<InvestmentLine, 'id'>,
): Result<TeamDraft> {
  if (!isEditable(draft.team.status)) {
    return validationError(
      'INVALID_AMOUNT',
      '投資の編集は入力中（investing）のときのみ可能です',
    );
  }

  const amountResult = validateInvestmentAmount(line.amount);
  if (!amountResult.ok) {
    return amountResult;
  }

  const nextInvestments: InvestmentLine[] = [
    ...draft.investments,
    { ...line, id: crypto.randomUUID() },
  ];
  const total = sumInvestments(nextInvestments);
  const totalResult = validateInvestmentTotal(
    total,
    draft.team.currentAsset,
  );
  if (!totalResult.ok) {
    return totalResult;
  }

  return {
    ok: true,
    value: { ...draft, investments: nextInvestments },
  };
}

export function removeInvestment(draft: TeamDraft, lineId: string): TeamDraft {
  if (!isEditable(draft.team.status)) {
    return draft;
  }

  return {
    ...draft,
    investments: draft.investments.filter((line) => line.id !== lineId),
  };
}
