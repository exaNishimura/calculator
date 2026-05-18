import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type GameButtonVariant = 'primary' | 'secondary' | 'danger';

export interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: GameButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<GameButtonVariant, string> = {
  primary: 'bg-game-accent text-white hover:bg-blue-500 active:bg-blue-600',
  secondary:
    'border border-game-border bg-game-surface text-white hover:bg-game-border active:bg-game-bg',
  danger: 'bg-game-loss text-white hover:bg-red-500 active:bg-red-600',
};

export function GameButton({
  children,
  variant = 'primary',
  fullWidth = true,
  className = '',
  type = 'button',
  ...props
}: GameButtonProps) {
  return (
    <button
      type={type}
      className={[
        'min-h-14 rounded-xl px-6 text-lg font-bold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-game-accent',
        fullWidth ? 'w-full' : '',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
