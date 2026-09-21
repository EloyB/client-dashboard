import { headers } from 'next/headers';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { listClients } from '@/features/clients/queries';
import { ClientsTable } from './ClientsTable';

export default async function ClientsPage() {
  const clients = await listClients(await headers());

  return (
    <>
      <PageHeader title="Klanten" />
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        {clients.length === 0 ? (
          <EmptyState
            variant="neutral"
            title="Nog geen klanten"
            description="Er zijn nog geen klanten toegevoegd."
          />
        ) : (
          <ClientsTable clients={clients} />
        )}
      </div>
    </>
  );
}
