import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';

import { DateBlock, ListRow } from '@/components/shared/ListRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import { getUpcomingWeekRange } from '@/features/events/calendarGrid';
import { eventSubtitle, isOverdueDeadline } from '@/features/events/helpers';
import { listEventsForCalendar } from '@/features/events/queries.admin';
import {
  cn,
  combineBrusselsDateTime,
  parseDateOnly,
  splitBrusselsDateTime,
  todayInBrussels,
} from '@/lib/utils';
import { DashboardSectionCard } from './DashboardSectionCard';

/** "Vandaag" / "Te laat" / the weekday name — matches the design's compact per-row status label. */
function dayLabel(dateOnly: string, today: string): string {
  if (dateOnly === today) return 'Vandaag';
  if (dateOnly < today) return 'Te laat';
  return format(parseDateOnly(dateOnly)!, 'EEEE', { locale: nl });
}

export async function UpcomingAgendaSection() {
  const today = todayInBrussels();
  const { rangeStart, rangeEndExclusive } = getUpcomingWeekRange(today);

  const events = await listEventsForCalendar(await headers(), {
    start: combineBrusselsDateTime(rangeStart),
    end: combineBrusselsDateTime(rangeEndExclusive),
  });

  return (
    <DashboardSectionCard
      title="Vandaag en komende 7 dagen"
      actionLabel="Volledige agenda"
      actionHref="/app/calendar"
    >
      {events.length === 0 ? (
        <EmptyState
          variant="positive"
          title="Niets gepland"
          description="Agenda-items voor de komende week verschijnen hier."
        />
      ) : (
        events.map((event) => {
          const overdue = isOverdueDeadline(event, new Date());
          const { dateOnly } = splitBrusselsDateTime(event.startsAt);
          const date = parseDateOnly(dateOnly)!;

          return (
            <ListRow
              key={event.id}
              leading={
                <DateBlock month={format(date, 'MMM', { locale: nl })} day={format(date, 'd')} />
              }
              title={
                <span className={cn('flex items-center gap-2', overdue && 'text-destructive')}>
                  <EventTypeMarker type={event.type} overdue={overdue} />
                  {event.title}
                </span>
              }
              subtitle={`${eventSubtitle(event)} · ${event.projectName}`}
              trailing={
                <span
                  className={cn(
                    'text-small shrink-0 rounded-full px-2 py-1 font-semibold',
                    overdue
                      ? 'bg-destructive-muted text-destructive'
                      : dateOnly === today
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {dayLabel(dateOnly, today)}
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
