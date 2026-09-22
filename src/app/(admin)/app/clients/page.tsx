import { Plus } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { listClients } from '@/features/clients/queries';
import { ClientsTable } from './ClientsTable';

export default async function ClientsPage() {
  const clients = await listClients(await headers());

  return (
    <>
      <PageHeader
        title="Klanten"
        primaryAction={
          <Button asChild>
            <Link href="/app/clients/new">
              <Plus strokeWidth={1.75} />
              Nieuwe klant
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        {clients.length === 0 ? (
          <EmptyState
            variant="invite"
            title="Nog geen klanten"
            description="Voeg uw eerste klant toe om projecten en tickets te kunnen koppelen."
            action={
              <Button asChild>
                <Link href="/app/clients/new">
                  <Plus strokeWidth={1.75} />
                  Nieuwe klant
                </Link>
              </Button>
            }
          />
        ) : (
          <ClientsTable clients={clients} />
        )}
      </div>
    </>
  );
}
