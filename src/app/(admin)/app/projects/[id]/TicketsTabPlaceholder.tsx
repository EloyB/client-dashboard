import { EmptyState } from '@/components/shared/EmptyState';

/** Filled in by slice 5d. */
export function TicketsTabPlaceholder() {
  return (
    <EmptyState
      variant="neutral"
      title="Nog geen tickets"
      description="Meldingen voor dit project komen hier terecht."
    />
  );
}
