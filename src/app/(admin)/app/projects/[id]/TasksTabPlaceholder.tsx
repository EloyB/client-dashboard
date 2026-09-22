import { EmptyState } from '@/components/shared/EmptyState';

/** Filled in by slice 7a. */
export function TasksTabPlaceholder() {
  return (
    <EmptyState
      variant="neutral"
      title="Nog geen taken"
      description="Taken voor dit project komen hier terecht."
    />
  );
}
