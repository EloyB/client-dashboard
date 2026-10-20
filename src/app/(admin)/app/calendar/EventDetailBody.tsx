import { EventTypeMarker } from '@/components/shared/EventTypeMarker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { eventTimeLabel, isOverdueDeadline, typeLabels } from '@/features/events/helpers';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/features/events/queries.admin';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-border-subtle flex items-start justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export function EventDetailBody({ event }: { event: CalendarEvent }) {
  const overdue = isOverdueDeadline(event, new Date());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <DetailRow label="Wanneer">
          <span className={cn(overdue && 'text-destructive')}>{eventTimeLabel(event)}</span>
        </DetailRow>
        <DetailRow label="Project">{event.projectName}</DetailRow>
        <DetailRow label="Klant">{event.clientName}</DetailRow>
        {event.location && <DetailRow label="Locatie">{event.location}</DetailRow>}
        <div className="flex items-center justify-between gap-4 py-2 text-sm">
          <span className="text-muted-foreground">Zichtbaarheid</span>
          <StatusBadge domain="visibility" visibleToClient={event.visibleToClient} />
        </div>
      </div>
      {event.description && (
        <p className="text-body text-foreground/80 whitespace-pre-wrap">{event.description}</p>
      )}
    </div>
  );
}

export function EventDetailHeading({ event }: { event: CalendarEvent }) {
  const overdue = isOverdueDeadline(event, new Date());

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-small text-muted-foreground flex items-center gap-1.5 font-semibold">
        <EventTypeMarker type={event.type} overdue={overdue} />
        {typeLabels[event.type]}
      </span>
      <span className={cn('font-display text-h3 leading-snug', overdue && 'text-destructive')}>
        {event.title}
      </span>
    </div>
  );
}
