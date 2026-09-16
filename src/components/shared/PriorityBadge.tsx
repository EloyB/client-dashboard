import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Priority = 'low' | 'medium' | 'high';

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

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const config = priorityConfig[priority];

  return (
    <Badge variant="outline" className={cn('gap-1.5', config.className, className)}>
      <span className={cn('size-1.5 rounded-full', config.dotClassName)} />
      {config.label}
    </Badge>
  );
}
