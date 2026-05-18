import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FACILITATOR_TEAMS } from '@/constants/teams';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const navigate = useNavigate();
  const { loginTeam } = useAuth();
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const result = await loginTeam(teamCode);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(`/team/${teamCode.trim().toLowerCase()}`);
  };

  return (
    <AppShell title="ホーム">
      <div className="space-y-4">
        <p className="text-game-muted">
          各委員会・執行部のファシリテーター向けです。配布されたチームコードでログインしてください。
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm text-game-muted" htmlFor="team-code">
            チームコード（ファシリテーター用）
          </label>
          <input
            id="team-code"
            data-testid="team-code"
            value={teamCode}
            onChange={(event) => setTeamCode(event.target.value)}
            className="w-full rounded-xl border border-game-border bg-game-surface px-4 py-3 text-white"
            placeholder="例: shogai"
            autoComplete="off"
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl border border-game-border bg-game-accent px-4 py-4 text-center font-semibold text-white"
          >
            チーム画面へ
          </button>
        </form>

        <details className="rounded-xl border border-game-border bg-game-surface px-4 py-3 text-sm text-game-muted">
          <summary className="cursor-pointer font-medium text-white">
            チームコード一覧
          </summary>
          <ul className="mt-3 space-y-2">
            {FACILITATOR_TEAMS.map((team) => (
              <li key={team.teamCode}>
                <span className="font-mono text-white">{team.teamCode}</span>
                {' — '}
                {team.teamName}
              </li>
            ))}
          </ul>
        </details>

        <nav className="flex flex-col gap-3 pt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-game-muted">
            草愛銀行
          </p>
          <Link
            to="/bank"
            data-testid="home-bank-link"
            className="rounded-xl border-2 border-yellow-500/60 bg-yellow-500/10 px-4 py-4 text-center font-semibold text-yellow-200"
          >
            融資申込（チーム向け）
          </Link>
          <Link
            to="/bank/desk/login"
            data-testid="home-bank-desk-link"
            className="rounded-xl border-2 border-amber-600/70 bg-amber-950/40 px-4 py-4 text-center font-semibold text-amber-100"
          >
            融資管理画面（銀行行員）
          </Link>

          <p className="pt-1 text-xs font-medium uppercase tracking-wide text-game-muted">
            運営
          </p>
          <Link
            to="/admin"
            data-testid="home-admin-link"
            className="rounded-xl border border-game-border bg-game-surface px-4 py-4 text-center font-semibold text-white"
          >
            運営ダッシュボード
          </Link>
        </nav>
      </div>
    </AppShell>
  );
}
