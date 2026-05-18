import type { HTMLAttributes, ReactNode } from 'react';
import type { AmountTone } from './AmountDisplay';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: Exclude<AmountTone, 'neutral'> | 'neutral';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-game-border text-slate-200',
  profit: 'bg-game-profit/15 text-game-profit',
  loss: 'bg-game-loss/15 text-game-loss',
  warning: 'bg-game-warning/15 text-game-warning',
};

export function Badge({
  children,
  tone = 'neutral',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-semibold',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
