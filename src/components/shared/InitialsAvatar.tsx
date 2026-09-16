import { cn } from '@/lib/utils';

/** Fallback avatar for a client, project, or person: initials on a tile. */
export function InitialsAvatar({
  initials,
  shape = 'square',
  className,
}: {
  initials: string;
  shape?: 'square' | 'circle';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-small flex size-9 shrink-0 items-center justify-center font-semibold',
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        className,
      )}
    >
      {initials}
    </div>
  );
}
