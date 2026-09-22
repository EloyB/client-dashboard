import { headers } from 'next/headers';

import { DetailHeader } from '@/components/shared/DetailHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { listSelectableProjectsForClient } from '@/features/tickets/queries';
import { requireClientUser } from '@/lib/access';
import { ReportBugForm } from './ReportBugForm';

export default async function ReportBugPage() {
  const user = await requireClientUser(await headers());
  const projects = await listSelectableProjectsForClient(user);

  if (projects.length === 0) {
    return (
      <>
        <DetailHeader
          breadcrumbs={[
            { label: 'Tickets', href: '/portal/tickets' },
            { label: 'Probleem melden' },
          ]}
          title="Probleem melden"
        />
        <div className="p-4 sm:p-6 lg:p-8">
          <EmptyState
            variant="neutral"
            title="Geen actieve projecten"
            description="Er zijn nog geen actieve projecten om een melding aan te koppelen."
          />
        </div>
      </>
    );
  }

  return <ReportBugForm projects={projects} />;
}
