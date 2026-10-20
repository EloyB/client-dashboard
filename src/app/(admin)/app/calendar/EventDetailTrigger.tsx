'use client';

import { Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import { useIsDesktop } from '@/components/shared/useIsDesktop';
import { deleteEvent } from '@/features/events/actions';
import type { CalendarEvent } from '@/features/events/queries.admin';
import { EventDetailBody, EventDetailHeading } from './EventDetailBody';

function DeleteEventAction({ event, onDeleted }: { event: CalendarEvent; onDeleted: () => void }) {
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
      onDeleted();
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="text-destructive text-small cursor-pointer font-semibold hover:underline"
      >
        Verwijderen
      </button>
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

/**
 * Click an event anywhere in the calendar (month, week, or mobile list) and
 * get the detail view from the designs: a popover on desktop, a bottom sheet
 * on mobile — same content either way, via EventDetailBody/Heading.
 */
export function EventDetailTrigger({
  event,
  onEdit,
  children,
}: {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  /** Render-prop for the chip visual: desktop lets PopoverTrigger own the click, mobile wires its own. */
  children: (onClick: () => void) => ReactNode;
}) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);

  function handleEdit() {
    setOpen(false);
    onEdit(event);
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children(() => {})}</PopoverTrigger>
        <PopoverContent className="w-96 gap-0 p-0" align="start">
          <div className="border-border-subtle flex items-start justify-between gap-3 border-b p-4">
            <EventDetailHeading event={event} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Sluiten"
              className="shrink-0"
            >
              <X strokeWidth={1.75} />
            </Button>
          </div>
          <div className="p-4">
            <EventDetailBody event={event} />
          </div>
          <div className="border-border-subtle flex items-center justify-between gap-2 border-t p-3">
            <DeleteEventAction event={event} onDeleted={() => setOpen(false)} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/projects/${event.projectId}`}>Naar project</Link>
              </Button>
              <Button size="sm" onClick={handleEdit}>
                Bewerken
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {children(() => setOpen(true))}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-0">
          <SheetHeader className="border-border-subtle border-b">
            <EventDetailHeading event={event} />
          </SheetHeader>
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-4">
            <div className="py-4">
              <EventDetailBody event={event} />
            </div>
          </div>
          <SheetFooter className="border-border-subtle flex-col gap-2 border-t">
            <Button onClick={handleEdit}>Bewerken</Button>
            <Button variant="outline" asChild>
              <Link href={`/app/projects/${event.projectId}`}>Naar project</Link>
            </Button>
            <DeleteEventAction event={event} onDeleted={() => setOpen(false)} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
