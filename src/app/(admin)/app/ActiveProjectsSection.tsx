import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/EmptyState';
import { listProjects } from '@/features/projects/queries';
import { cn } from '@/lib/utils';
import { DashboardSectionCard } from './DashboardSectionCard';

const SECTION_LIMIT = 6;

export async function ActiveProjectsSection() {
  const projects = await listProjects(await headers(), undefined, {
    status: 'active',
    limit: SECTION_LIMIT,
  });

  return (
    <DashboardSectionCard
      title="Actieve projecten"
      actionLabel="Alle projecten"
      actionHref="/app/projects?status=active"
    >
      {projects.length === 0 ? (
        <EmptyState
          variant="invite"
          title="Geen actieve projecten"
          description="Projecten met status 'Actief' verschijnen hier."
        />
      ) : (
        projects.map((project) => {
          const overdue = project.nextDeadline && project.nextDeadline.startsAt < new Date();

          return (
            <div
              key={project.id}
              className="border-border-subtle flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/app/projects/${project.id}`} className="font-medium hover:underline">
                  {project.name}
                </Link>
                <p className="text-small text-muted-foreground">{project.clientName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:shrink-0">
                {project.nextDeadline ? (
                  <span className="text-small">
                    <span className={cn('font-medium', overdue && 'text-destructive')}>
                      {format(project.nextDeadline.startsAt, 'd MMM', { locale: nl })}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      (
                      {formatDistanceToNow(project.nextDeadline.startsAt, {
                        locale: nl,
                        addSuffix: true,
                      })}
                      )
                    </span>
                  </span>
                ) : (
                  <span className="text-small text-muted-foreground">Geen deadline</span>
                )}
                <span className="text-small text-muted-foreground">
                  {project.openTicketCount} {project.openTicketCount === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>
            </div>
          );
        })
      )}
    </DashboardSectionCard>
  );
}
