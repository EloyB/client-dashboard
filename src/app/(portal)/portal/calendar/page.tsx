import { headers } from 'next/headers';

import { PageHeader } from '@/components/shared/PageHeader';
import { listEventsForClient } from '@/features/events/queries.portal';
import { requireClientUser } from '@/lib/access';
import { PortalAgendaContent } from './PortalAgendaContent';

export default async function PortalCalendarPage() {
  const user = await requireClientUser(await headers());
  const events = await listEventsForClient(user);

  return (
    <>
      <PageHeader title="Agenda" />
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <p className="text-body text-muted-foreground -mt-2">
          Afspraken en data die met uw projecten te maken hebben.
        </p>
        <PortalAgendaContent events={events} />
      </div>
    </>
  );
}
