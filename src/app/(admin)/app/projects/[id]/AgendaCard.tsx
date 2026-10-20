'use client';

import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DateBlock, ListRow } from '@/components/shared/ListRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import { deleteEvent } from '@/features/events/actions';
import {
  dateBlockParts,
  eventSubtitle,
  isOverdueDeadline,
  splitUpcomingAndPast,
  type AgendaEvent,
} from '@/features/events/helpers';
import { cn } from '@/lib/utils';
import { EventFormSheet, type EditableEvent } from './EventFormSheet';

function toEditable(event: AgendaEvent, projectId: string): EditableEvent {
  return {
    id: event.id,
    projectId,
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

function DeleteEventMenu({ event }: { event: AgendaEvent }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteEvent({ eventId: event.id });
      if (!result.success) {
        showErrorToast('Verwijderen mislukt', result.formError);
        return;
      }
      showSuccessToast('Agenda-item verwijderd');
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Meer acties">
            <MoreHorizontal strokeWidth={1.75} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 strokeWidth={1.75} />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Agenda-item verwijderen?"
        description={`${event.title} wordt definitief verwijderd.`}
        confirmLabel={isDeleting ? 'Bezig...' : 'Verwijderen'}
        confirmIcon={Trash2}
        variant="destructive"
        confirmationText={event.title}
        onConfirm={handleDelete}
      />
    </>
  );
}

function EventRow({ event, onEdit }: { event: AgendaEvent; onEdit: (event: AgendaEvent) => void }) {
  const overdue = isOverdueDeadline(event, new Date());
  const { month, day } = dateBlockParts(event);

  return (
    <div data-testid={`event-row-${event.id}`}>
      <ListRow
        leading={<DateBlock month={month} day={day} />}
        title={
          <button
            type="button"
            onClick={() => onEdit(event)}
            className="flex items-center gap-2 text-left"
          >
            <EventTypeMarker type={event.type} overdue={overdue} />
            <span className={cn(overdue && 'text-destructive line-through')}>{event.title}</span>
          </button>
        }
        subtitle={<span className={cn(overdue && 'text-destructive')}>{eventSubtitle(event)}</span>}
        trailing={
          <div className="flex items-center gap-1.5">
            <StatusBadge domain="visibility" visibleToClient={event.visibleToClient} />
            <DeleteEventMenu event={event} />
          </div>
        }
        className="border-border-subtle border-b py-3 last:border-0"
      />
    </div>
  );
}

export function AgendaCard({ events, projectId }: { events: AgendaEvent[]; projectId: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditableEvent | undefined>(undefined);
  const [showPast, setShowPast] = useState(false);
  const { upcoming, past } = splitUpcomingAndPast(events, new Date());

  function openCreate() {
    setEditingEvent(undefined);
    setFormOpen(true);
  }

  function openEdit(event: AgendaEvent) {
    setEditingEvent(toEditable(event, projectId));
    setFormOpen(true);
  }

  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Komende agenda</CardTitle>
        <CardAction>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus strokeWidth={1.75} />
            Item toevoegen
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">
        {upcoming.length === 0 ? (
          <EmptyState
            variant="neutral"
            title="Niets gepland"
            description="Agenda-items voor dit project komen hier terecht."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus strokeWidth={1.75} />
                Item toevoegen
              </Button>
            }
          />
        ) : (
          upcoming.map((event) => <EventRow key={event.id} event={event} onEdit={openEdit} />)
        )}

        {past.length > 0 && (
          <div className="mt-2 flex flex-col">
            <button
              type="button"
              onClick={() => setShowPast((current) => !current)}
              className="text-small text-muted-foreground self-start py-2 underline-offset-2 hover:underline"
            >
              {showPast ? 'Voorbije items verbergen' : `Voorbije items tonen (${past.length})`}
            </button>
            {showPast &&
              past.map((event) => <EventRow key={event.id} event={event} onEdit={openEdit} />)}
          </div>
        )}
      </CardContent>

      <EventFormSheet
        key={editingEvent?.id ?? 'new'}
        projectId={projectId}
        event={editingEvent}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </Card>
  );
}
