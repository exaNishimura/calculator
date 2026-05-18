import type { ReactNode } from 'react';

interface AppShellProps {
  title: string;
  children: ReactNode;
  contentClassName?: string;
}

export function AppShell({
  title,
  children,
  contentClassName = '',
}: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-game-border bg-game-surface px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-game-muted">
          GAME 02 命の配分
        </p>
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </header>
      <main
        className={[
          'mx-auto w-full max-w-lg flex-1 px-4 py-6',
          contentClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
    </div>
  );
}
