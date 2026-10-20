import { headers } from 'next/headers';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { listTicketsForAdmin } from '@/features/tickets/queries.admin';
import { TicketsTable } from './TicketsTable';

export default async function AdminTicketsPage() {
  const ticketRows = await listTicketsForAdmin(await headers());

  return (
    <>
      <PageHeader title="Tickets" />
      <div className="flex flex-col gap-3 p-4 sm:p-6 lg:p-8">
        {ticketRows.length === 0 ? (
          <EmptyState
            variant="neutral"
            title="Nog geen tickets"
            description="Meldingen van klanten komen hier terecht."
          />
        ) : (
          <>
            <p className="text-small text-muted-foreground">
              {ticketRows.length === 1 ? '1 ticket' : `${ticketRows.length} tickets`}
            </p>
            <TicketsTable tickets={ticketRows} />
          </>
        )}
      </div>
    </>
  );
}
