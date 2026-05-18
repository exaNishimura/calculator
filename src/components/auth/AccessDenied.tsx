import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

interface AccessDeniedProps {
  title: string;
  message: string;
}

export function AccessDenied({ title, message }: AccessDeniedProps) {
  return (
    <AppShell title={title}>
      <p className="mb-4 text-game-muted">{message}</p>
      <Link
        to="/"
        className="block rounded-xl border border-game-border bg-game-surface px-4 py-4 text-center font-semibold text-white"
      >
        ホームへ戻る
      </Link>
    </AppShell>
  );
}
