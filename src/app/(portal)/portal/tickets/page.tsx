import { Bug } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { listTicketsForClient } from '@/features/tickets/queries';
import { requireClientUser } from '@/lib/access';
import { TicketsTable } from './TicketsTable';

export default async function PortalTicketsPage() {
  const user = await requireClientUser(await headers());
  const ticketRows = await listTicketsForClient(user);

  return (
    <>
      <PageHeader
        title="Mijn meldingen"
        primaryAction={
          <Button asChild>
            <Link href="/portal/tickets/new">
              <Bug strokeWidth={1.75} />
              Bug melden
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-3 p-4 sm:p-6 lg:p-8">
        {ticketRows.length === 0 ? (
          <EmptyState
            variant="invite"
            title="Nog geen meldingen"
            description="U hebt nog niets gemeld. Ziet u iets dat niet werkt op uw website, laat het ons hier weten — dan pakken we het op."
            action={
              <Button asChild>
                <Link href="/portal/tickets/new">
                  <Bug strokeWidth={1.75} />
                  Bug melden
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <p className="text-small text-muted-foreground">
              {ticketRows.length === 1 ? '1 melding' : `${ticketRows.length} meldingen`}
            </p>
            <TicketsTable tickets={ticketRows} />
          </>
        )}
      </div>
    </>
  );
}
