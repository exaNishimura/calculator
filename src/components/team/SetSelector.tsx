import { SET_MAX } from '@/constants';
import { Card } from '@/components/ui';

interface SetSelectorProps {
  currentSet: number;
  viewingSetNumber: number;
  completedSetNumbers: number[];
  onChange: (setNumber: number) => void;
}

export function SetSelector({
  currentSet,
  viewingSetNumber,
  completedSetNumbers,
  onChange,
}: SetSelectorProps) {
  const completed = new Set(completedSetNumbers);
  const options = Array.from({ length: SET_MAX }, (_, index) => index + 1).filter(
    (setNumber) => setNumber === currentSet || completed.has(setNumber),
  );

  if (options.length <= 1) {
    return null;
  }

  return (
    <Card data-testid="set-selector">
      <label
        className="mb-2 block text-sm font-semibold uppercase tracking-wide text-game-muted"
        htmlFor="viewing-set"
      >
        編集する SET
      </label>
      <select
        id="viewing-set"
        value={viewingSetNumber}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-game-border bg-game-bg px-4 py-3 text-lg font-bold text-white"
      >
        {options.map((setNumber) => {
          const suffix =
            setNumber === currentSet
              ? '（進行中）'
              : completed.has(setNumber)
                ? '（確定済み）'
                : '';
          return (
            <option key={setNumber} value={setNumber}>
              SET {setNumber}
              {suffix}
            </option>
          );
        })}
      </select>
    </Card>
  );
}
