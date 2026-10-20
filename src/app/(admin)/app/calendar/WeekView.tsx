import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import type { WeekGrid } from '@/features/events/calendarGrid';
import { eventTimeLabel, isOverdueDeadline } from '@/features/events/helpers';
import type { CalendarEvent } from '@/features/events/queries.admin';
import { cn, parseDateOnly, splitBrusselsDateTime } from '@/lib/utils';
import { EventDetailTrigger } from './EventDetailTrigger';

const START_HOUR = 8;
const END_HOUR = 17;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const ROW_HEIGHT = 54;
const GRID_HEIGHT = (HOURS.length - 1) * ROW_HEIGHT;

function timedEventPosition(event: CalendarEvent): { top: number; height: number } {
  const start = splitBrusselsDateTime(event.startsAt);
  const [startHour, startMinute] = start.time.split(':').map(Number);
  const rawTop = (startHour - START_HOUR) * ROW_HEIGHT + (startMinute / 60) * ROW_HEIGHT;

  let durationMinutes = 40;
  if (event.endsAt) {
    durationMinutes = Math.max(20, (event.endsAt.getTime() - event.startsAt.getTime()) / 60000);
  }
  const rawHeight = (durationMinutes / 60) * ROW_HEIGHT;

  // Clamp onto the visible 08:00–17:00 window — a rare evening event still
  // shows, pinned near the relevant edge, instead of disappearing.
  const top = Math.min(Math.max(rawTop, 0), GRID_HEIGHT - 24);
  const height = Math.min(rawHeight, GRID_HEIGHT - top);
  return { top, height };
}

export function WeekView({
  grid,
  events,
  today,
  onEditEvent,
  onCreateOn,
}: {
  grid: WeekGrid;
  events: CalendarEvent[];
  /** 'yyyy-MM-dd' in Europe/Brussels. */
  today: string;
  onEditEvent: (event: CalendarEvent) => void;
  onCreateOn: (date: Date) => void;
}) {
  const allDayEvents = events.filter((event) => event.allDay);
  const timedEvents = events.filter((event) => !event.allDay);

  const eventsForDay = (dateOnly: string, pool: CalendarEvent[]) =>
    pool.filter((event) => splitBrusselsDateTime(event.startsAt).dateOnly === dateOnly);

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b">
        <div className="border-border-subtle border-r" />
        {grid.days.map((dateOnly) => {
          const isToday = dateOnly === today;
          const date = parseDateOnly(dateOnly)!;
          return (
            <div
              key={dateOnly}
              className={cn(
                'border-border-subtle flex flex-col gap-0.5 border-r px-3 py-2 last:border-r-0',
                isToday && 'bg-primary/5',
              )}
            >
              <span className="text-small text-muted-foreground font-semibold uppercase">
                {format(date, 'EEE', { locale: nl })}
              </span>
              <span
                className={cn(
                  'font-display text-lg font-semibold',
                  isToday ? 'text-primary' : 'text-foreground',
                )}
              >
                {format(date, 'd')}
              </span>
            </div>
          );
        })}
      </div>

      {allDayEvents.length > 0 && (
        <div className="bg-muted/20 grid grid-cols-[60px_repeat(5,1fr)] border-b">
          <div className="border-border-subtle text-muted-foreground border-r px-2 py-1.5 text-right text-xs">
            Hele dag
          </div>
          {grid.days.map((dateOnly) => (
            <div
              key={dateOnly}
              className="border-border-subtle flex flex-col gap-1 border-r p-1.5 last:border-r-0"
            >
              {eventsForDay(dateOnly, allDayEvents).map((event) => {
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
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[60px_repeat(5,1fr)]">
        <div className="border-border-subtle flex flex-col border-r">
          {HOURS.slice(0, -1).map((hour) => (
            <div
              key={hour}
              style={{ height: ROW_HEIGHT }}
              className="border-border-subtle text-muted-foreground border-b px-2 py-1 text-right font-mono text-xs"
            >
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {grid.days.map((dateOnly) => {
          const isToday = dateOnly === today;
          return (
            <div
              key={dateOnly}
              className={cn(
                'border-border-subtle relative border-r last:border-r-0',
                isToday && 'bg-primary/5',
              )}
              style={{ height: GRID_HEIGHT }}
            >
              {HOURS.slice(0, -1).map((hour, index) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => {
                    const date = parseDateOnly(dateOnly)!;
                    date.setHours(hour);
                    onCreateOn(date);
                  }}
                  aria-label={`Item toevoegen op ${dateOnly} om ${hour}:00`}
                  className="border-border-subtle hover:bg-muted/40 absolute inset-x-0 border-b"
                  style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                />
              ))}
              {eventsForDay(dateOnly, timedEvents).map((event) => {
                const overdue = isOverdueDeadline(event, new Date());
                const { top, height } = timedEventPosition(event);
                return (
                  <EventDetailTrigger key={event.id} event={event} onEdit={onEditEvent}>
                    {(handleClick) => (
                      <button
                        type="button"
                        onClick={handleClick}
                        style={{ top, height }}
                        className={cn(
                          'absolute inset-x-1 flex flex-col overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left text-xs',
                          overdue
                            ? 'border-destructive bg-destructive/10 text-destructive'
                            : 'border-primary bg-primary/10 text-foreground',
                        )}
                      >
                        <span className="flex items-center gap-1.5 truncate font-semibold">
                          <EventTypeMarker type={event.type} overdue={overdue} />
                          <span className="truncate">{event.title}</span>
                        </span>
                        <span className="text-muted-foreground truncate">
                          {eventTimeLabel(event)}
                        </span>
                      </button>
                    )}
                  </EventDetailTrigger>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
