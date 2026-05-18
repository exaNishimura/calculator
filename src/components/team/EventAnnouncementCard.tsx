import type { GameSession, Team } from '@/types/domain';
import { getEventById } from '@/constants';
import { Card } from '@/components/ui';
import { getActiveEventForTeam } from '@/services';
import {
  ALL_SECTOR_ROWS,
  formatSectorImpact,
  getSectorImpactTone,
} from './eventFormat';

interface EventAnnouncementCardProps {
  team: Team;
  session: GameSession | null;
  heading?: string;
}

export function EventAnnouncementCard({
  team,
  session,
  heading = '発表イベント',
}: EventAnnouncementCardProps) {
  const eventId = session ? getActiveEventForTeam(team, session) : null;
  const event = eventId ? getEventById(eventId) : null;

  if (!event) {
    return null;
  }

  return (
    <Card data-testid="event-announcement-card">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-game-muted">
        {heading}
      </h2>
      <p className="mb-3 text-xl font-bold text-white">{event.name}</p>
      <p className="mb-2 text-xs text-game-muted">
        {event.kind === 'bonus' ? '倍率（BONUS）' : '増減率'}
      </p>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {ALL_SECTOR_ROWS.map((sector) => {
          const tone = getSectorImpactTone(event, sector.id);
          const toneClass =
            tone === 'profit'
              ? 'text-game-profit'
              : tone === 'loss'
                ? 'text-game-loss'
                : 'text-game-muted';
          return (
            <li
              key={sector.id}
              className="flex items-center justify-between rounded-lg bg-game-bg/60 px-2 py-1.5"
            >
              <span className="text-white">{sector.label}</span>
              <span className={`font-mono font-bold ${toneClass}`}>
                {formatSectorImpact(event, sector.id)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
