import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import type { MonthGrid } from '@/features/events/calendarGrid';
import { groupEventsByDay } from '@/features/events/calendarGrid';
import { isOverdueDeadline } from '@/features/events/helpers';
import type { CalendarEvent } from '@/features/events/queries.admin';
import { cn, parseDateOnly } from '@/lib/utils';
import { EventDetailTrigger } from './EventDetailTrigger';

const WEEKDAY_LABELS = [
  'Maandag',
  'Dinsdag',
  'Woensdag',
  'Donderdag',
  'Vrijdag',
  'Zaterdag',
  'Zondag',
];
const MAX_VISIBLE_PER_DAY = 2;

export function MonthView({
  grid,
  events,
  today,
  onEditEvent,
  onCreateOn,
}: {
  grid: MonthGrid;
  events: CalendarEvent[];
  /** 'yyyy-MM-dd' in Europe/Brussels. */
  today: string;
  onEditEvent: (event: CalendarEvent) => void;
  onCreateOn: (date: Date) => void;
}) {
  const eventsByDay = groupEventsByDay(events);

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="bg-muted/40 grid grid-cols-7 border-b">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-small text-muted-foreground border-border-subtle border-r px-3 py-2 font-semibold uppercase last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.weeks.flatMap((week, weekIndex) =>
          week.map((dateOnly, dayIndex) => {
            const key = `${weekIndex}-${dayIndex}`;
            if (!dateOnly) {
              return (
                <div
                  key={key}
                  className="border-border-subtle bg-muted/20 min-h-24 border-r border-b last:border-r-0"
                />
              );
            }

            const dayEvents = eventsByDay.get(dateOnly) ?? [];
            const isToday = dateOnly === today;
            const visible = dayEvents.slice(0, MAX_VISIBLE_PER_DAY);
            const overflowCount = dayEvents.length - visible.length;

            return (
              <div
                key={key}
                data-testid={`month-cell-${dateOnly}`}
                className="border-border-subtle flex min-h-24 flex-col gap-1.5 border-r border-b p-2 last:border-r-0"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onCreateOn(parseDateOnly(dateOnly)!)}
                    className={cn(
                      'font-display flex size-6 items-center justify-center rounded-full text-sm font-semibold',
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                    )}
                    aria-label={`Item toevoegen op ${dateOnly}`}
                  >
                    {dateOnly.slice(-2).replace(/^0/, '')}
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {visible.map((event) => {
                    const overdue = isOverdueDeadline(event, new Date());
                    return (
                      <EventDetailTrigger key={event.id} event={event} onEdit={onEditEvent}>
                        {(handleClick) => (
                          <button
                            type="button"
                            onClick={handleClick}
                            className={cn(
                              'flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-xs font-medium',
                              overdue
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-primary/10 text-foreground',
                            )}
                          >
                            <EventTypeMarker type={event.type} overdue={overdue} />
                            <span className="truncate">{event.title}</span>
                          </button>
                        )}
                      </EventDetailTrigger>
                    );
                  })}
                  {overflowCount > 0 && (
                    <span className="text-muted-foreground px-1.5 text-xs font-semibold">
                      +{overflowCount} meer
                    </span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
