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

const ticketStatusConfig: Record<TicketStatus, { label: string; className: string }> = {
  new: { label: 'Nieuw', className: 'bg-info-muted text-info hover:bg-info-muted' },
  in_progress: {
    label: 'In behandeling',
    className: 'bg-accent text-accent-foreground hover:bg-accent',
  },
  resolved: {
    label: 'Opgelost',
    className: 'bg-success-muted text-success hover:bg-success-muted',
  },
  closed: { label: 'Gesloten', className: 'bg-muted text-neutral-500 hover:bg-muted' },
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
  | { domain: 'ticket'; status: TicketStatus; className?: string }
  | { domain: 'document'; visibleToClient: boolean; className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  const config =
    props.domain === 'task'
      ? taskStatusConfig[props.status]
      : props.domain === 'ticket'
        ? ticketStatusConfig[props.status]
        : visibilityConfig[props.visibleToClient ? 'shared' : 'internal'];

  return <Badge className={cn(config.className, props.className)}>{config.label}</Badge>;
}
