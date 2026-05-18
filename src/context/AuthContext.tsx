import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/instances';
import type { Team } from '@/types/domain';
import {
  readStoredAdminAuth,
  readStoredBankAuth,
  readStoredTeamCode,
  writeStoredAdminAuth,
  writeStoredBankAuth,
  writeStoredTeamCode,
} from './authStorage';

interface AuthContextValue {
  team: Team | null;
  teamCode: string | null;
  isAdmin: boolean;
  isBank: boolean;
  loginTeam: (code: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  loginAdmin: (passcode: string) => { ok: true } | { ok: false; message: string };
  loginBank: (passcode: string) => { ok: true } | { ok: false; message: string };
  logoutTeam: () => void;
  logoutAdmin: () => void;
  logoutBank: () => void;
  authorizeTeamFromRoute: (
    routeTeamCode: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [teamCode, setTeamCode] = useState<string | null>(() => readStoredTeamCode());
  const [isAdmin, setIsAdmin] = useState(() => readStoredAdminAuth());
  const [isBank, setIsBank] = useState(() => readStoredBankAuth());

  const loginTeam = useCallback(async (code: string) => {
    const found = await authService.validateTeamCode(code);
    if (!found) {
      return { ok: false as const, message: '無効なチームコードです' };
    }
    const normalized = found.teamCode.toLowerCase();
    setTeam(found);
    setTeamCode(normalized);
    writeStoredTeamCode(normalized);
    return { ok: true as const };
  }, []);

  const loginAdmin = useCallback((passcode: string) => {
    if (!authService.validateAdminPasscode(passcode)) {
      return { ok: false as const, message: '無効な管理用パスコードです' };
    }
    setIsAdmin(true);
    writeStoredAdminAuth(true);
    return { ok: true as const };
  }, []);

  const logoutTeam = useCallback(() => {
    setTeam(null);
    setTeamCode(null);
    writeStoredTeamCode(null);
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    writeStoredAdminAuth(false);
  }, []);

  const loginBank = useCallback((passcode: string) => {
    if (!authService.validateBankPasscode(passcode)) {
      return { ok: false as const, message: '無効な行員パスコードです' };
    }
    setIsBank(true);
    writeStoredBankAuth(true);
    return { ok: true as const };
  }, []);

  const logoutBank = useCallback(() => {
    setIsBank(false);
    writeStoredBankAuth(false);
  }, []);

  const authorizeTeamFromRoute = useCallback(
    async (routeTeamCode: string) => {
      const normalizedRoute = routeTeamCode.trim().toLowerCase();
      if (teamCode === normalizedRoute && team) {
        return { ok: true as const };
      }
      return loginTeam(normalizedRoute);
    },
    [loginTeam, team, teamCode],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      team,
      teamCode,
      isAdmin,
      isBank,
      loginTeam,
      loginAdmin,
      loginBank,
      logoutTeam,
      logoutAdmin,
      logoutBank,
      authorizeTeamFromRoute,
    }),
    [
      authorizeTeamFromRoute,
      isAdmin,
      isBank,
      loginAdmin,
      loginBank,
      loginTeam,
      logoutAdmin,
      logoutBank,
      logoutTeam,
      team,
      teamCode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
