import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListRow } from '@/components/shared/ListRow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { AdminTicketListRow } from '@/features/tickets/queries.admin';

/** Filled in by slice 5d — a limited recent list, with a link to the full overview filtered on this project. */
export function TicketsTab({
  tickets,
  projectId,
}: {
  tickets: AdminTicketListRow[];
  projectId: string;
}) {
  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Tickets</CardTitle>
        {tickets.length > 0 && (
          <CardAction>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/app/tickets?projectId=${projectId}`}>Alles bekijken</Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col">
        {tickets.length === 0 ? (
          <EmptyState
            variant="neutral"
            title="Nog geen tickets"
            description="Meldingen voor dit project komen hier terecht."
          />
        ) : (
          tickets.map((ticket) => (
            <Link key={ticket.id} href={`/app/tickets/${ticket.id}`} className="block">
              <ListRow
                title={ticket.title}
                subtitle={ticket.reference}
                trailing={<StatusBadge domain="ticket" status={ticket.status} />}
                className="border-border-subtle border-b py-3 last:border-0"
              />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
