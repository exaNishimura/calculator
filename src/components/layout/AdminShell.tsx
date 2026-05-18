import type { ReactNode } from 'react';

interface AdminShellProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AdminShell({ title, children, actions }: AdminShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-game-border bg-game-surface px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-game-muted">
              GAME 02 命の配分 — 運営
            </p>
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
