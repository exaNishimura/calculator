import type { Result, Team } from '@/types/domain';
import {
  canBorrow as canBorrowByAsset,
  computeFinalAsset as computeFinalAssetValue,
  tryBorrow,
} from '@/utils/validation';
import { isInvestmentEditable } from './types';

export function canBorrow(team: Team): boolean {
  if (!isInvestmentEditable(team.status)) {
    return false;
  }
  return canBorrowByAsset(team.currentAsset, team.borrowedInCurrentSet);
}

export function executeBorrow(team: Team): Result<Team> {
  if (!isInvestmentEditable(team.status)) {
    return {
      ok: false,
      error: {
        code: 'BORROW_NOT_ALLOWED',
        message: '借入は入力中（investing）のときのみ可能です',
      },
    };
  }

  const result = tryBorrow(
    team.currentAsset,
    team.totalDebt,
    team.borrowedInCurrentSet,
  );
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    value: {
      ...team,
      currentAsset: result.value.currentAsset,
      totalDebt: result.value.totalDebt,
      borrowedInCurrentSet: true,
    },
  };
}

export function computeFinalAsset(team: Team): number {
  return computeFinalAssetValue(team.currentAsset, team.totalDebt);
}
