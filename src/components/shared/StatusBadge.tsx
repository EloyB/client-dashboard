import type { Priority, ProjectStatus, TaskStatus, TicketStatus } from '@/db/schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  planned: { label: 'Gepland', className: 'bg-info-muted text-info hover:bg-info-muted' },
  active: { label: 'Actief', className: 'bg-accent text-accent-foreground hover:bg-accent' },
  maintenance: {
    label: 'Onderhoud',
    className: 'bg-muted text-secondary-foreground hover:bg-muted',
  },
  completed: {
    label: 'Afgerond',
    className: 'bg-success-muted text-success hover:bg-success-muted',
  },
  archived: { label: 'Gearchiveerd', className: 'bg-muted text-neutral-400 hover:bg-muted' },
};

const priorityConfig: Record<Priority, { label: string; className: string; dotClassName: string }> =
  {
    low: {
      label: 'Laag',
      className: 'border-border text-foreground',
      dotClassName: 'bg-neutral-400',
    },
    medium: {
      label: 'Middel',
      className: 'border-warning-border text-warning',
      dotClassName: 'bg-warning-solid',
    },
    high: {
      label: 'Hoog',
      className: 'border-destructive-border text-destructive',
      dotClassName: 'bg-destructive',
    },
  };

const visibilityConfig = {
  shared: { label: 'Gedeeld', className: 'bg-success-muted text-success hover:bg-success-muted' },
  internal: {
    label: 'Intern',
    className: 'bg-muted text-secondary-foreground hover:bg-muted',
  },
} as const;

// Derived from user.emailVerified (see slice 1b) — no separate status column.
const userStatusConfig = {
  active: { label: 'Actief', className: 'bg-success-muted text-success hover:bg-success-muted' },
  invited: {
    label: 'Uitgenodigd',
    className: 'bg-warning-muted text-warning hover:bg-warning-muted',
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
  | { domain: 'project'; status: ProjectStatus; className?: string }
  | { domain: 'priority'; priority: Priority; className?: string }
  | { domain: 'document'; visibleToClient: boolean; className?: string }
  | { domain: 'user'; emailVerified: boolean; className?: string };

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

  if (props.domain === 'project') {
    const config = projectStatusConfig[props.status];
    return <Badge className={cn(config.className, props.className)}>{config.label}</Badge>;
  }

  if (props.domain === 'priority') {
    const config = priorityConfig[props.priority];
    return (
      <Badge variant="outline" className={cn('gap-1.5', config.className, props.className)}>
        <span className={cn('size-1.5 rounded-full', config.dotClassName)} />
        {config.label}
      </Badge>
    );
  }

  if (props.domain === 'document') {
    const config = visibilityConfig[props.visibleToClient ? 'shared' : 'internal'];
    return <Badge className={cn(config.className, props.className)}>{config.label}</Badge>;
  }

  const config = userStatusConfig[props.emailVerified ? 'active' : 'invited'];
  return <Badge className={cn(config.className, props.className)}>{config.label}</Badge>;
}
