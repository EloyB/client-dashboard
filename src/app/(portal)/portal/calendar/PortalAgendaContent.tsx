'use client';

import { useMemo, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import { Pill } from '@/components/shared/Pill';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { EventType } from '@/db/schema';
import { groupEventsByDay } from '@/features/events/calendarGrid';
import {
  eventTimeLabel,
  isOverdueDeadline,
  splitUpcomingAndPast,
  typeLabels,
  typeOrder,
  type AgendaEvent,
} from '@/features/events/helpers';
import type { PortalEventRow } from '@/features/events/queries.portal';
import { cn, parseDateOnly } from '@/lib/utils';

function toAgendaEvent(
  event: PortalEventRow,
): AgendaEvent & { projectId: string; projectName: string } {
  // visibleToClient isn't part of the portal row — every row here already is,
  // by construction of listEventsForClient — but the shared helpers need the
  // field to accept the value structurally.
  return { ...event, visibleToClient: true };
}

function PortalEventCard({
  event,
}: {
  event: AgendaEvent & { projectId: string; projectName: string };
}) {
  const overdue = isOverdueDeadline(event, new Date());

  return (
    <div
      className={cn(
        'border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:gap-4',
        overdue && 'border-destructive-border',
      )}
    >
      <div className="text-muted-foreground w-20 shrink-0 font-mono text-sm">
        {event.allDay ? 'Hele dag' : eventTimeLabel(event)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn('flex items-center gap-1.5 font-semibold', overdue && 'text-destructive')}
          >
            <EventTypeMarker type={event.type} overdue={overdue} />
            {event.title}
          </span>
          <StatusBadge domain="eventType" type={event.type} className="shrink-0" />
        </div>
        {event.description && (
          <p className="text-body text-muted-foreground">{event.description}</p>
        )}
        <p className="text-small text-muted-foreground">
          {event.projectName}
          {event.location ? ` · ${event.location}` : ''}
        </p>
      </div>
    </div>
  );
}

function AgendaList({
  events,
  emptyTitle,
  emptyDescription,
  highlightFirstAsSoon = false,
}: {
  events: (AgendaEvent & { projectId: string; projectName: string })[];
  emptyTitle: string;
  emptyDescription: string;
  /** Shows a "Binnenkort" badge on the nearest day group — only meaningful for upcoming items. */
  highlightFirstAsSoon?: boolean;
}) {
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const days = useMemo(
    () => Array.from(eventsByDay.keys()).sort((a, b) => a.localeCompare(b)),
    [eventsByDay],
  );

  if (days.length === 0) {
    return <EmptyState variant="neutral" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map((dateOnly, index) => {
        const dayEvents = eventsByDay.get(dateOnly) ?? [];
        const date = parseDateOnly(dateOnly)!;
        return (
          <div key={dateOnly} className="flex flex-col gap-2">
            <div className="bg-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2">
              <span className="font-display text-sm font-semibold capitalize">
                {new Intl.DateTimeFormat('nl-BE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }).format(date)}
              </span>
              {highlightFirstAsSoon && index === 0 && (
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                  Binnenkort
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {dayEvents.map((event) => (
                <PortalEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PortalAgendaContent({ events }: { events: PortalEventRow[] }) {
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const agendaEvents = useMemo(() => events.map(toAgendaEvent), [events]);

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const event of events) seen.set(event.projectId, event.projectName);
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [events]);

  const filteredEvents = useMemo(
    () =>
      agendaEvents.filter(
        (event) =>
          (typeFilter === 'all' || event.type === typeFilter) &&
          (projectFilter === 'all' || event.projectId === projectFilter),
      ),
    [agendaEvents, typeFilter, projectFilter],
  );

  const { upcoming, past } = useMemo(
    () => splitUpcomingAndPast(filteredEvents, new Date()),
    [filteredEvents],
  );

  return (
    <Tabs defaultValue="komende">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="komende">
              Komende
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs">
                {upcoming.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="voorbij">Voorbij</TabsTrigger>
          </TabsList>
          {projectOptions.length > 1 && (
            <div className="hidden sm:block">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-56" aria-label="Alle projecten">
                  <SelectValue placeholder="Alle projecten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle projecten</SelectItem>
                  {projectOptions.map((project) => (
                    <SelectItem key={project.value} value={project.value}>
                      {project.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill label="Alle" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          {typeOrder.map((type) => (
            <Pill
              key={type}
              label={typeLabels[type]}
              active={typeFilter === type}
              onClick={() => setTypeFilter(type)}
            />
          ))}
        </div>
      </div>

      <TabsContent value="komende" className="mt-4">
        <AgendaList
          events={upcoming}
          emptyTitle="Niets gepland"
          emptyDescription="Zodra er nieuwe afspraken of deadlines zijn voor uw projecten, ziet u ze hier."
          highlightFirstAsSoon
        />
      </TabsContent>
      <TabsContent value="voorbij" className="mt-4">
        <AgendaList
          events={past}
          emptyTitle="Nog niets geweest"
          emptyDescription="Afgelopen afspraken en deadlines verschijnen hier."
        />
      </TabsContent>
    </Tabs>
  );
}
