import { useState } from 'react';
import { ALL_EVENTS } from '@/constants';
import type { EventId } from '@/types/domain';
import { Card, GameButton } from '@/components/ui';

interface EventAssignPanelProps {
  setNumber: number;
  activeEventId: EventId | null;
  busy: boolean;
  onAssign: (eventId: EventId) => Promise<void>;
}

export function EventAssignPanel({
  setNumber,
  activeEventId,
  busy,
  onAssign,
}: EventAssignPanelProps) {
  const [selected, setSelected] = useState<EventId>(
    activeEventId ?? ALL_EVENTS[0]!.id,
  );
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    setError(null);
    try {
      await onAssign(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'イベント確定に失敗しました');
    }
  };

  return (
    <Card data-testid="event-assign-panel" className="!p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-game-muted">
        SET{setNumber} イベント割当
      </h2>
      <label
        className="mb-2 block text-sm text-game-muted"
        htmlFor="admin-event-select"
      >
        発生イベントを選択
      </label>
      <select
        id="admin-event-select"
        value={selected}
        onChange={(event) => setSelected(event.target.value as EventId)}
        className="mb-3 w-full rounded-xl border border-game-border bg-game-bg px-3 py-2 text-white"
      >
        {ALL_EVENTS.map((event) => (
          <option key={event.id} value={event.id}>
            {event.kind === 'bonus' ? `[BONUS] ${event.name}` : event.name}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mb-2 text-sm text-game-loss" role="alert">
          {error}
        </p>
      ) : null}
      <GameButton disabled={busy} onClick={() => void handleAssign()}>
        この SET のイベントを確定
      </GameButton>
    </Card>
  );
}
