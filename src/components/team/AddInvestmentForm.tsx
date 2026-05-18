import { useState, type FormEvent } from 'react';
import { INVESTMENT_UNIT } from '@/constants';
import { SECTORS } from '@/constants/sectors';
import type { Sector } from '@/types/domain';
import { Card, GameButton } from '@/components/ui';

interface AddInvestmentFormProps {
  maxUnits: number;
  onAdd: (sector: Sector, amount: number) => boolean;
}

export function AddInvestmentForm({ maxUnits, onAdd }: AddInvestmentFormProps) {
  const [sector, setSector] = useState<Sector>('agriculture');
  const [units, setUnits] = useState(1);

  const amount = units * INVESTMENT_UNIT;
  const unitOptions = Math.max(1, Math.floor(maxUnits));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const ok = onAdd(sector, amount);
    if (ok) {
      setUnits(1);
    }
  };

  return (
    <Card data-testid="add-investment-form">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-game-muted">
        投資を追加
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-game-muted">
          投資先
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value as Sector)}
            className="mt-1 w-full rounded-xl border border-game-border bg-game-bg px-3 py-3 text-white"
          >
            {SECTORS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-game-muted">
          金額
          <select
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-game-border bg-game-bg px-3 py-3 text-white"
          >
            {Array.from({ length: unitOptions }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {(n * INVESTMENT_UNIT).toLocaleString('ja-JP')}P
              </option>
            ))}
          </select>
        </label>
        <GameButton type="submit">投資を追加</GameButton>
      </form>
    </Card>
  );
}
