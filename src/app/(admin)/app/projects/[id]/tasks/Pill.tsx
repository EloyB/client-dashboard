import { cn } from '@/lib/utils';

/** The rounded pill-filter look from COMPONENTS.md/DataTable, reused outside a DataTable (board filters, the mobile column switcher). */
export function Pill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-body flex h-11 items-center gap-1.5 rounded-full border px-3.5 whitespace-nowrap sm:h-9',
        active
          ? 'border-transparent bg-neutral-900 text-white'
          : 'border-border-strong bg-card text-foreground',
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'text-small rounded-full px-1.5',
            active ? 'bg-white/20' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
