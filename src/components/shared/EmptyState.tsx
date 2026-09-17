import { CircleCheck, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type EmptyStateVariant = 'invite' | 'filtered' | 'positive' | 'neutral';

const iconByVariant: Partial<Record<EmptyStateVariant, ReactNode>> = {
  filtered: <SearchX className="text-muted-foreground size-5" />,
  positive: <CircleCheck className="text-success size-5" />,
};

export function EmptyState({
  variant = 'invite',
  title,
  description,
  action,
  className,
}: {
  variant?: EmptyStateVariant;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  const icon = iconByVariant[variant];

  if (variant === 'positive') {
    return (
      <div
        className={cn(
          'border-border bg-card flex items-start gap-3 rounded-xl border px-6 py-4',
          className,
        )}
      >
        {icon}
        <div>
          <p className="font-display text-base font-semibold">{title}</p>
          <p className="text-body text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  const dashed = variant === 'invite' || variant === 'filtered';

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center',
        dashed ? 'border-dashed border-neutral-300' : 'border-border bg-card',
        className,
      )}
    >
      {icon}
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="text-body text-muted-foreground max-w-md">{description}</p>
      {action}
    </div>
  );
}
