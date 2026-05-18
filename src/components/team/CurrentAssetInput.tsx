import { useEffect, useState, type FormEvent } from 'react';
import type { InvestmentLine, Team } from '@/types/domain';
import { Card, GameButton } from '@/components/ui';
import { sumInvestments, validateCurrentAsset } from '@/utils/validation';

interface CurrentAssetInputProps {
  team: Team;
  investments: InvestmentLine[];
  onSave: (amount: number) => Promise<void>;
}

function parseAmountInput(value: string): number {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) {
    return NaN;
  }
  return Number(normalized);
}

export function CurrentAssetInput({
  team,
  investments,
  onSave,
}: CurrentAssetInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInput(team.currentAsset > 0 ? String(team.currentAsset) : '');
  }, [team.currentAsset]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const amount = parseAmountInput(input);
    const validation = validateCurrentAsset(amount);
    if (!validation.ok) {
      setError(validation.error.message);
      return;
    }

    const totalInvested = sumInvestments(investments);
    if (totalInvested > amount) {
      setError('投資合計が現在資産を超えています。投資を減らすか金額を増やしてください');
      return;
    }

    setBusy(true);
    try {
      await onSave(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      data-testid="current-asset-input"
      className="border-2 border-game-accent/70 shadow-xl shadow-blue-500/15"
    >
      <h2 className="mb-2 text-base font-bold uppercase tracking-wide text-white">
        現在資産
      </h2>
      <p className="mb-3 text-sm text-game-muted">
        GAME 01 の結果（ペリカ）を入力してください
      </p>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        <label className="block text-sm text-game-muted" htmlFor="current-asset">
          金額（P）
        </label>
        <input
          id="current-asset"
          type="number"
          min={0}
          step={1000}
          inputMode="numeric"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="例: 500000"
          className="w-full rounded-xl border border-game-border bg-game-bg px-4 py-3 text-2xl font-bold text-white"
        />
        {error ? (
          <p className="text-sm text-game-loss" role="alert">
            {error}
          </p>
        ) : null}
        <GameButton
          type="submit"
          variant="primary"
          disabled={busy}
          className="min-h-16 text-xl shadow-lg shadow-blue-500/35 ring-2 ring-white/20"
        >
          現在資産を保存
        </GameButton>
      </form>
    </Card>
  );
}
