import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Generic list row: leading visual, title/subtitle, trailing content (see COMPONENTS.md "Lijstrij"). */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {leading}
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {subtitle ? <p className="text-small text-muted-foreground">{subtitle}</p> : null}
      </div>
      {trailing}
    </div>
  );
}

/** Timeline row: dot, text, timestamp (see COMPONENTS.md "Lijstrijvarianten"). */
export function TimelineItem({
  children,
  timestamp,
  className,
}: {
  children: ReactNode;
  timestamp: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neutral-300" />
      <p className="text-body flex-1">
        {children} <span className="text-muted-foreground">· {timestamp}</span>
      </p>
    </div>
  );
}

/** Month/day block used as the leading visual for agenda list rows. */
export function DateBlock({
  month,
  day,
  className,
}: {
  month: string;
  day: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border-subtle flex w-11 shrink-0 flex-col items-center border-r pr-3 text-center',
        className,
      )}
    >
      <span className="text-small text-muted-foreground uppercase">{month}</span>
      <span className="text-h2 font-display">{day}</span>
    </div>
  );
}
