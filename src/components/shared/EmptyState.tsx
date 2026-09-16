import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-6 py-14 text-center',
        className,
      )}
    >
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="text-body text-muted-foreground max-w-md">{description}</p>
      {action}
    </div>
  );
}
