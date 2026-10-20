/**
 * A short, shareable label derived straight from the real id — not stored
 * anywhere, always recomputed. Same idea as ticketReference() in
 * ticket-links.ts; tasks have no portal-facing URL (admin-only, edited via
 * a sheet rather than a detail route), so this file only holds the one helper.
 */
export function taskReference(taskId: string): string {
  return `TSK-${taskId.slice(0, 8).toUpperCase()}`;
}
