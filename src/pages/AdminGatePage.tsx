import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';

export function AdminGatePage() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const result = loginAdmin(passcode);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate('/admin/dashboard');
  };

  return (
    <AppShell title="運営ログイン">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm text-game-muted" htmlFor="admin-passcode">
          管理用パスコード
        </label>
        <input
          id="admin-passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          className="w-full rounded-xl border border-game-border bg-game-surface px-4 py-3 text-white"
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-xl border border-game-border bg-game-accent px-4 py-4 text-center font-semibold text-white"
        >
          ダッシュボードへ
        </button>
      </form>
    </AppShell>
  );
}
