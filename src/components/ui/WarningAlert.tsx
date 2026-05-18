import type { ReactNode } from 'react';

export interface WarningAlertProps {
  children: ReactNode;
  title?: string;
}

export function WarningAlert({ children, title }: WarningAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-game-warning/60 bg-game-warning/10 px-4 py-3 text-game-warning"
    >
      {title ? <p className="mb-1 text-sm font-bold">{title}</p> : null}
      <p className="text-base font-semibold text-amber-100">{children}</p>
    </div>
  );
}
