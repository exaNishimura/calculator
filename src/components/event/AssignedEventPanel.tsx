import type { GameSession, Team } from '@/types/domain';
import { EventAnnouncementCard } from '@/components/team/EventAnnouncementCard';

interface AssignedEventPanelProps {
  team: Team;
  session: GameSession | null;
}

export function AssignedEventPanel({ team, session }: AssignedEventPanelProps) {
  return (
    <EventAnnouncementCard
      team={team}
      session={session}
      heading="割当イベント"
    />
  );
}
