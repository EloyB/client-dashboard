import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { Suspense } from 'react';

import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { DashboardSectionSkeleton } from '@/components/shared/DashboardSectionCard';
import { getCurrentUser } from '@/lib/access';
import { parseDateOnly, todayInBrussels } from '@/lib/utils';
import { PortalAgendaSection } from './PortalAgendaSection';
import { PortalBugReportCard } from './PortalBugReportCard';
import { PortalDocumentsSection } from './PortalDocumentsSection';
import { PortalProjectsSection } from './PortalProjectsSection';
import { PortalTicketsSection } from './PortalTicketsSection';

export default async function PortalStartPage() {
  const requestHeaders = await headers();
  const currentUser = await getCurrentUser(requestHeaders);

  const [user] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, currentUser!.id))
    .limit(1);

  const firstName = user.name.split(' ')[0];
  const today = parseDateOnly(todayInBrussels())!;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col">
        <span className="text-small text-muted-foreground capitalize">
          {format(today, 'EEEE d MMMM yyyy', { locale: nl })}
        </span>
        <h1 className="font-display text-h2">Welkom, {firstName}</h1>
      </div>

      <PortalBugReportCard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <Suspense fallback={<DashboardSectionSkeleton rows={3} />}>
            <PortalTicketsSection />
          </Suspense>
          <Suspense fallback={<DashboardSectionSkeleton rows={3} />}>
            <PortalProjectsSection />
          </Suspense>
        </div>
        <div className="flex flex-col gap-4">
          <Suspense fallback={<DashboardSectionSkeleton rows={3} />}>
            <PortalAgendaSection />
          </Suspense>
          <Suspense fallback={<DashboardSectionSkeleton rows={3} />}>
            <PortalDocumentsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
