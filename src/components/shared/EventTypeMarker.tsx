import { cn } from '@/lib/utils';
import type { AgendaEvent } from '@/features/events/helpers';

/** Shape (not just color) per COMPONENTS.md: deadline = bar, overleg = circle, mijlpaal = diamond, andere = square. */
export function EventTypeMarker({
  type,
  overdue,
}: {
  type: AgendaEvent['type'];
  overdue?: boolean;
}) {
  const colorClass = overdue ? 'bg-destructive' : 'bg-primary';

  if (type === 'deadline') {
    return <span className={cn('h-3 w-1 shrink-0 rounded-full', colorClass)} />;
  }
  if (type === 'meeting') {
    return <span className={cn('size-2 shrink-0 rounded-full', colorClass)} />;
  }
  if (type === 'milestone') {
    return <span className={cn('size-2 shrink-0 rotate-45', colorClass)} />;
  }
  return <span className={cn('size-2 shrink-0', colorClass)} />;
}
