export type AmountTone = 'neutral' | 'profit' | 'loss' | 'warning';

export interface AmountDisplayProps {
  amount: number;
  label?: string;
  tone?: AmountTone;
  className?: string;
}

const toneClasses: Record<AmountTone, string> = {
  neutral: 'text-white',
  profit: 'text-game-profit',
  loss: 'text-game-loss',
  warning: 'text-game-warning',
};

function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}P`;
}

export function AmountDisplay({
  amount,
  label,
  tone = 'neutral',
  className = '',
}: AmountDisplayProps) {
  return (
    <div className={className}>
      {label ? (
        <p className="mb-1 text-sm font-medium text-game-muted">{label}</p>
      ) : null}
      <p
        data-testid="amount-display"
        className={`text-4xl font-bold tracking-tight sm:text-5xl ${toneClasses[tone]}`}
      >
        {formatAmount(amount)}
      </p>
    </div>
  );
}
