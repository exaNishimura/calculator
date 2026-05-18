export const AUTH_STORAGE_KEYS = {
  teamCode: 'game02:auth:team',
  admin: 'game02:auth:admin',
  bank: 'game02:auth:bank',
} as const;

export function readStoredTeamCode(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.teamCode);
}

export function writeStoredTeamCode(teamCode: string | null): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  if (teamCode) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.teamCode, teamCode);
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.teamCode);
  }
}

export function readStoredAdminAuth(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.admin) === '1';
}

export function writeStoredAdminAuth(isAdmin: boolean): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  if (isAdmin) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.admin, '1');
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.admin);
  }
}

export function readStoredBankAuth(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.bank) === '1';
}

export function writeStoredBankAuth(isBank: boolean): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  if (isBank) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.bank, '1');
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.bank);
  }
}
