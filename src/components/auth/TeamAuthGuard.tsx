import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { initTeamDraftStoreSync, useTeamDraftStore } from '@/stores';
import { AccessDenied } from './AccessDenied';

interface TeamAuthGuardProps {
  children: ReactNode;
}

export function TeamAuthGuard({ children }: TeamAuthGuardProps) {
  const { teamCode = '' } = useParams<{ teamCode: string }>();
  const { authorizeTeamFromRoute } = useAuth();
  const loadTeam = useTeamDraftStore((state) => state.loadTeam);
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    let unsubscribeSync: (() => void) | undefined;

    const run = async () => {
      setStatus('loading');
      const auth = await authorizeTeamFromRoute(teamCode);
      if (cancelled) {
        return;
      }
      if (!auth.ok) {
        setMessage(auth.message);
        setStatus('denied');
        return;
      }

      const loaded = await loadTeam(teamCode);
      if (cancelled) {
        return;
      }
      if (!loaded) {
        setMessage('チームが見つかりません');
        setStatus('denied');
        return;
      }

      unsubscribeSync = initTeamDraftStoreSync(teamCode);
      setStatus('allowed');
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribeSync?.();
    };
  }, [authorizeTeamFromRoute, loadTeam, teamCode]);

  if (status === 'loading') {
    return (
      <AppShell title={`チーム ${teamCode}`}>
        <p className="text-game-muted">認証を確認しています…</p>
      </AppShell>
    );
  }

  if (status === 'denied') {
    return (
      <AccessDenied
        title="アクセス拒否"
        message={message || '無効なチームコードです'}
      />
    );
  }

  return <>{children}</>;
}
