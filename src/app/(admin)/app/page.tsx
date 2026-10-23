import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { Suspense } from 'react';

import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { getCurrentUser } from '@/lib/access';
import { greetingForBrusselsHour, parseDateOnly, todayInBrussels } from '@/lib/utils';
import { listProjects } from '@/features/projects/queries';
import { ActiveProjectsSection } from './ActiveProjectsSection';
import { DashboardSectionSkeleton } from './DashboardSectionCard';
import { MyTasksSection } from './MyTasksSection';
import { NewTicketsSection } from './NewTicketsSection';
import { QuickActions } from './QuickActions';
import { UpcomingAgendaSection } from './UpcomingAgendaSection';

export default async function AdminHomePage() {
  const requestHeaders = await headers();
  const currentUser = await getCurrentUser(requestHeaders);

  const [[admin], projectRows] = await Promise.all([
    db
      .select({ name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, currentUser!.id))
      .limit(1),
    listProjects(requestHeaders),
  ]);

  const firstName = admin.name.split(' ')[0];
  const today = parseDateOnly(todayInBrussels())!;
  const projects = projectRows.map((project) => ({ id: project.id, name: project.name }));

  return (
    <>
      <div className="border-border-subtle flex flex-col gap-4 border-b bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:px-8">
        <div className="flex flex-col">
          <span className="text-small text-muted-foreground capitalize">
            {format(today, 'EEEE d MMMM yyyy', { locale: nl })}
          </span>
          <h1 className="font-display text-h2">
            {greetingForBrusselsHour()}, {firstName}
          </h1>
        </div>
        <QuickActions projects={projects} />
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2 lg:p-8">
        <div className="lg:col-span-2">
          <Suspense fallback={<DashboardSectionSkeleton rows={4} />}>
            <NewTicketsSection />
          </Suspense>
        </div>
        <Suspense fallback={<DashboardSectionSkeleton rows={4} />}>
          <UpcomingAgendaSection />
        </Suspense>
        <Suspense fallback={<DashboardSectionSkeleton rows={4} />}>
          <MyTasksSection />
        </Suspense>
        <div className="lg:col-span-2">
          <Suspense fallback={<DashboardSectionSkeleton rows={3} />}>
            <ActiveProjectsSection />
          </Suspense>
        </div>
      </div>
    </>
  );
}
