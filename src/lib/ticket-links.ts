import { env } from '@/lib/env';

/**
 * A short, shareable label derived straight from the real id — no sequence
 * column (same call as the PRJ-XXXX decision for projects and the
 * ticket-number decision in 5a's confirmation screen). Not stored anywhere;
 * always recomputed from the id.
 */
export function ticketReference(ticketId: string): string {
  return `TCK-${ticketId.slice(0, 8).toUpperCase()}`;
}

/**
 * /portal/tickets/[id] and /app/tickets/[id] don't exist yet (5c/5d) — these
 * are the routes those slices are expected to use, matching the existing
 * /portal/tickets/new sibling and the flat /app/projects/[id] convention.
 * Centralized so only this file needs updating if that changes.
 */
export function portalTicketUrl(ticketId: string): string {
  return `${env.BETTER_AUTH_URL}/portal/tickets/${ticketId}`;
}

export function adminTicketUrl(ticketId: string): string {
  return `${env.BETTER_AUTH_URL}/app/tickets/${ticketId}`;
}
