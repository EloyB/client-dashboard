'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LayoutGrid } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import type { MonthGrid } from '@/features/events/calendarGrid';
import { groupEventsByDay } from '@/features/events/calendarGrid';
import { eventTimeLabel, isOverdueDeadline } from '@/features/events/helpers';
import type { CalendarEvent } from '@/features/events/queries.admin';
import { cn, parseDateOnly } from '@/lib/utils';
import { EventDetailTrigger } from './EventDetailTrigger';

export function MobileAgendaList({
  monthGrid,
  events,
  today,
  onEditEvent,
  onJumpToDate,
}: {
  /** Used only to build the "jump to date" month picker, independent of the current month/week view. */
  monthGrid: MonthGrid;
  events: CalendarEvent[];
  /** 'yyyy-MM-dd' in Europe/Brussels. */
  today: string;
  onEditEvent: (event: CalendarEvent) => void;
  onJumpToDate: (date: string) => void;
}) {
  const [jumpOpen, setJumpOpen] = useState(false);
  const dayRefs = useRef(new Map<string, HTMLDivElement>());

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const days = useMemo(
    () => Array.from(eventsByDay.keys()).sort((a, b) => a.localeCompare(b)),
    [eventsByDay],
  );

  function scrollToDay(dateOnly: string) {
    dayRefs.current.get(dateOnly)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const monthDays = monthGrid.weeks.flat().filter((d): d is string => d !== null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {monthDays.slice(0, 14).map((dateOnly) => {
            const hasEvents = (eventsByDay.get(dateOnly)?.length ?? 0) > 0;
            const isToday = dateOnly === today;
            return (
              <button
                key={dateOnly}
                type="button"
                onClick={() => scrollToDay(dateOnly)}
                className={cn(
                  'flex min-w-11 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1.5',
                  isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                <span className="text-[10px] font-semibold uppercase opacity-70">
                  {format(parseDateOnly(dateOnly)!, 'EEE', { locale: nl })}
                </span>
                <span className="font-display text-sm font-bold">{dateOnly.slice(-2)}</span>
                <span
                  className={cn(
                    'size-1 rounded-full',
                    hasEvents
                      ? isToday
                        ? 'bg-primary-foreground'
                        : 'bg-primary'
                      : 'bg-transparent',
                  )}
                />
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setJumpOpen(true)}
          aria-label="Naar maand springen"
          className="shrink-0"
        >
          <LayoutGrid strokeWidth={1.75} />
        </Button>
      </div>

      {days.length === 0 ? (
        <EmptyState
          variant="neutral"
          title="Niets gepland"
          description="Agenda-items voor deze periode komen hier terecht."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {days.map((dateOnly) => {
            const dayEvents = (eventsByDay.get(dateOnly) ?? []).sort(
              (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
            );
            const date = parseDateOnly(dateOnly)!;
            return (
              <div
                key={dateOnly}
                ref={(el) => {
                  if (el) dayRefs.current.set(dateOnly, el);
                }}
                data-testid={`agenda-day-${dateOnly}`}
                className="flex flex-col gap-2"
              >
                <div className="flex items-baseline gap-2 px-0.5">
                  <span className="font-display text-sm font-semibold">
                    {dateOnly === today ? 'Vandaag' : format(date, 'EEEE', { locale: nl })}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(date, 'd MMMM', { locale: nl })}
                  </span>
                </div>
                <div className="border-border bg-card flex flex-col rounded-xl border px-3">
                  {dayEvents.map((event) => {
                    const overdue = isOverdueDeadline(event, new Date());
                    return (
                      <EventDetailTrigger key={event.id} event={event} onEdit={onEditEvent}>
                        {(handleClick) => (
                          <button
                            type="button"
                            onClick={handleClick}
                            className="border-border-subtle flex items-start gap-3 border-b py-3 text-left last:border-0"
                          >
                            <span className="text-muted-foreground w-14 shrink-0 font-mono text-xs">
                              {eventTimeLabel(event)}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span
                                className={cn(
                                  'flex items-center gap-1.5 text-sm font-semibold',
                                  overdue && 'text-destructive line-through',
                                )}
                              >
                                <EventTypeMarker type={event.type} overdue={overdue} />
                                <span className="truncate">{event.title}</span>
                              </span>
                              <span className="text-muted-foreground truncate text-xs">
                                {event.projectName} · {event.clientName}
                              </span>
                            </span>
                          </button>
                        )}
                      </EventDetailTrigger>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={jumpOpen} onOpenChange={setJumpOpen}>
        <SheetContent side="bottom" className="max-h-[75vh]">
          <SheetHeader>
            <SheetTitle>Naar datum springen</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-7 gap-1 px-4 pb-6">
            {monthGrid.weeks.flat().map((dateOnly, index) => {
              if (!dateOnly) return <span key={index} />;
              const hasEvents = (eventsByDay.get(dateOnly)?.length ?? 0) > 0;
              return (
                <button
                  key={dateOnly}
                  type="button"
                  data-testid={`jump-day-${dateOnly}`}
                  onClick={() => {
                    setJumpOpen(false);
                    onJumpToDate(dateOnly);
                  }}
                  className={cn(
                    'flex min-h-10 items-center justify-center rounded-lg text-sm',
                    dateOnly === today
                      ? 'bg-primary text-primary-foreground font-bold'
                      : hasEvents
                        ? 'bg-muted font-semibold'
                        : 'text-muted-foreground',
                  )}
                >
                  {dateOnly.slice(-2).replace(/^0/, '')}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
