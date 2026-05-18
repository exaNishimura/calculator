import type { Team } from '@/types/domain';
import type { ITeamRepository } from './repositories/types';

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export class AuthService {
  constructor(private readonly teams: ITeamRepository) {}

  async validateTeamCode(code: string): Promise<Team | null> {
    const normalized = code.trim();
    if (!normalized) {
      return null;
    }
    return this.teams.getByCode(normalized);
  }

  validateAdminPasscode(passcode: string): boolean {
    const expected = import.meta.env.VITE_ADMIN_PASSCODE ?? '';
    if (!expected) {
      return false;
    }
    return timingSafeEqual(passcode, expected);
  }

  validateBankPasscode(passcode: string): boolean {
    const expected =
      import.meta.env.VITE_BANK_PASSCODE?.trim() ||
      import.meta.env.VITE_ADMIN_PASSCODE?.trim() ||
      '';
    if (!expected) {
      return false;
    }
    return timingSafeEqual(passcode, expected);
  }
}
