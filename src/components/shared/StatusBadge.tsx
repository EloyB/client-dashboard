import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'Te doen', className: 'bg-muted text-secondary-foreground hover:bg-muted' },
  in_progress: { label: 'Bezig', className: 'bg-accent text-accent-foreground hover:bg-accent' },
  review: { label: 'Review', className: 'bg-warning-muted text-warning hover:bg-warning-muted' },
  done: { label: 'Klaar', className: 'bg-success-muted text-success hover:bg-success-muted' },
};

export type TicketStatusAudience = 'admin' | 'portal';

const ticketStatusClassName: Record<TicketStatus, string> = {
  new: 'bg-info-muted text-info hover:bg-info-muted',
  in_progress: 'bg-accent text-accent-foreground hover:bg-accent',
  resolved: 'bg-success-muted text-success hover:bg-success-muted',
  closed: 'bg-muted text-neutral-500 hover:bg-muted',
};

// Same colors in both places; the portal uses friendlier wording for clients
// (see docs/design/INDEX.md, slice 5).
const ticketStatusLabel: Record<TicketStatusAudience, Record<TicketStatus, string>> = {
  admin: {
    new: 'Nieuw',
    in_progress: 'In behandeling',
    resolved: 'Opgelost',
    closed: 'Gesloten',
  },
  portal: {
    new: 'Ontvangen',
    in_progress: 'We zijn ermee bezig',
    resolved: 'Opgelost',
    closed: 'Afgesloten',
  },
};

const visibilityConfig = {
  shared: { label: 'Gedeeld', className: 'bg-success-muted text-success hover:bg-success-muted' },
  internal: {
    label: 'Intern',
    className: 'bg-muted text-secondary-foreground hover:bg-muted',
  },
} as const;

type StatusBadgeProps =
  | { domain: 'task'; status: TaskStatus; className?: string }
  | {
      domain: 'ticket';
      status: TicketStatus;
      audience?: TicketStatusAudience;
      className?: string;
    }
  | { domain: 'document'; visibleToClient: boolean; className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  if (props.domain === 'task') {
    const config = taskStatusConfig[props.status];
    return <Badge className={cn(config.className, props.className)}>{config.label}</Badge>;
  }

  if (props.domain === 'ticket') {
    const label = ticketStatusLabel[props.audience ?? 'admin'][props.status];
    return (
      <Badge className={cn(ticketStatusClassName[props.status], props.className)}>{label}</Badge>
    );
  }

  const config = visibilityConfig[props.visibleToClient ? 'shared' : 'internal'];
  return <Badge className={cn(config.className, props.className)}>{config.label}</Badge>;
}
