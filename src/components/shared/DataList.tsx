import { cn } from '@/lib/utils';

export type DataListItem = {
  label: string;
  value: string;
  mono?: boolean;
};

/** Label/value rows for read-only record details (see COMPONENTS.md "Gegevenslijst"). */
export function DataList({ items, className }: { items: DataListItem[]; className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="border-border-subtle flex items-center justify-between border-b py-2.5 last:border-0"
        >
          <span className="text-body text-muted-foreground">{item.label}</span>
          <span className={item.mono ? 'text-small font-mono' : 'text-body font-medium'}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
