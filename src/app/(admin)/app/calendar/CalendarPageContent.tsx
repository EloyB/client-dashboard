'use client';

import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EventFormSheet, type EditableEvent } from '@/app/(admin)/app/projects/[id]/EventFormSheet';
import { Pill } from '@/app/(admin)/app/projects/[id]/tasks/Pill';
import type { EventType } from '@/db/schema';
import {
  shiftMonth,
  shiftWeek,
  type MonthGrid,
  type WeekGrid,
} from '@/features/events/calendarGrid';
import { typeLabels, typeOrder } from '@/features/events/helpers';
import type { CalendarEvent } from '@/features/events/queries.admin';
import { MobileAgendaList } from './MobileAgendaList';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';

type View = 'month' | 'week';

function toEditable(event: CalendarEvent): EditableEvent {
  return {
    id: event.id,
    projectId: event.projectId,
    title: event.title,
    description: event.description,
    type: event.type,
    allDay: event.allDay,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location,
    visibleToClient: event.visibleToClient,
  };
}

export function CalendarPageContent({
  view,
  anchor,
  monthGrid,
  weekGrid,
  events,
  today,
  projects,
  activeProjectId,
  activeType,
}: {
  view: View;
  /** 'yyyy-MM-dd' in Europe/Brussels. */
  anchor: string;
  monthGrid: MonthGrid;
  weekGrid: WeekGrid;
  events: CalendarEvent[];
  today: string;
  projects: { id: string; name: string }[];
  activeProjectId?: string;
  activeType?: EventType;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditableEvent | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setView(next: View) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'month') params.delete('view');
    else params.set('view', next);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function shift(delta: number) {
    setParam('date', view === 'week' ? shiftWeek(anchor, delta) : shiftMonth(anchor, delta));
  }

  function jumpToDate(dateOnly: string) {
    setParam('date', dateOnly);
  }

  function openCreate(date?: Date) {
    setEditingEvent(undefined);
    setDefaultDate(date);
    setFormOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditingEvent(toEditable(event));
    setDefaultDate(undefined);
    setFormOpen(true);
  }

  const periodLabel = view === 'week' ? weekGrid.label : monthGrid.label;

  return (
    <>
      <PageHeader
        title="Agenda"
        secondaryAction={
          <div className="hidden overflow-hidden rounded-lg border lg:flex">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setView('month')}
            >
              Maand
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setView('week')}
            >
              Week
            </Button>
          </div>
        }
        primaryAction={
          <Button onClick={() => openCreate()}>
            <Plus strokeWidth={1.75} />
            Item toevoegen
          </Button>
        }
      />

      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <div className="hidden items-center justify-between gap-3 lg:flex">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Vorige">
              ‹
            </Button>
            <Button variant="outline" onClick={() => setParam('date', undefined)}>
              Vandaag
            </Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Volgende">
              ›
            </Button>
            <span className="font-display text-h3 capitalize">{periodLabel}</span>
          </div>
          <Select
            value={activeProjectId ?? 'all'}
            onValueChange={(value) => setParam('project', value)}
          >
            <SelectTrigger className="w-56" aria-label="Alle projecten">
              <SelectValue placeholder="Alle projecten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle projecten</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden flex-wrap gap-2 lg:flex">
          <Pill label="Alle" active={!activeType} onClick={() => setParam('type', undefined)} />
          {typeOrder.map((type) => (
            <Pill
              key={type}
              label={typeLabels[type]}
              active={activeType === type}
              onClick={() => setParam('type', type)}
            />
          ))}
        </div>

        <div className="hidden lg:block">
          {view === 'week' ? (
            <WeekView
              grid={weekGrid}
              events={events}
              today={today}
              onEditEvent={openEdit}
              onCreateOn={openCreate}
            />
          ) : (
            <MonthView
              grid={monthGrid}
              events={events}
              today={today}
              onEditEvent={openEdit}
              onCreateOn={openCreate}
            />
          )}
        </div>

        <div className="lg:hidden">
          <MobileAgendaList
            monthGrid={monthGrid}
            events={events}
            today={today}
            onEditEvent={openEdit}
            onJumpToDate={jumpToDate}
          />
        </div>
      </div>

      <EventFormSheet
        key={editingEvent?.id ?? defaultDate?.toISOString() ?? 'new'}
        projects={projects}
        event={editingEvent}
        defaultDate={defaultDate}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
