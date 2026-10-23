import { headers } from 'next/headers';

import { DashboardSectionCard } from '@/components/shared/DashboardSectionCard';
import { DateBlock, ListRow } from '@/components/shared/ListRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import { dateBlockParts, eventSubtitle } from '@/features/events/helpers';
import { listEventsForClient } from '@/features/events/queries.portal';
import { requireClientUser } from '@/lib/access';

const SECTION_LIMIT = 5;

export async function PortalAgendaSection() {
  const user = await requireClientUser(await headers());
  const allEvents = await listEventsForClient(user);

  const now = new Date();
  const upcoming = allEvents
    .filter((event) => (event.endsAt ?? event.startsAt) >= now)
    .slice(0, SECTION_LIMIT);

  return (
    <DashboardSectionCard title="Binnenkort" actionLabel="Agenda" actionHref="/portal/calendar">
      {upcoming.length === 0 ? (
        <EmptyState
          variant="invite"
          title="Niets gepland"
          description="Afspraken en deadlines voor uw projecten verschijnen hier."
        />
      ) : (
        upcoming.map((event) => {
          const { month, day } = dateBlockParts({ ...event, visibleToClient: true });
          return (
            <ListRow
              key={event.id}
              leading={<DateBlock month={month} day={day} />}
              title={
                <span className="flex items-center gap-2">
                  <EventTypeMarker type={event.type} />
                  {event.title}
                </span>
              }
              subtitle={
                <span className="flex flex-col gap-0.5">
                  <span>{eventSubtitle({ ...event, visibleToClient: true })}</span>
                  {event.description && (
                    <span className="text-foreground font-medium">{event.description}</span>
                  )}
                </span>
              }
              className="border-border-subtle border-b py-3 last:border-0"
            />
          );
        })
      )}
    </DashboardSectionCard>
  );
}
