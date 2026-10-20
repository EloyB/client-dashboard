import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';

import { DashboardSectionCard } from '@/components/shared/DashboardSectionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { listProjectsForClient } from '@/features/projects/queries.portal';
import { requireClientUser } from '@/lib/access';

function nextStepSentence(nextStep: { title: string; startsAt: Date }): string {
  const lowerFirst = nextStep.title.charAt(0).toLowerCase() + nextStep.title.slice(1);
  const date = format(nextStep.startsAt, 'EEEE d MMMM', { locale: nl });
  return `Volgende stap: ${lowerFirst} op ${date}.`;
}

export async function PortalProjectsSection() {
  const user = await requireClientUser(await headers());
  const projects = await listProjectsForClient(user);

  return (
    <DashboardSectionCard
      title="Uw projecten"
      actionLabel="Alle projecten"
      actionHref="/portal/projects"
    >
      {projects.length === 0 ? (
        <EmptyState
          variant="invite"
          title="Nog geen projecten"
          description="Projecten die wij voor u uitvoeren, verschijnen hier."
        />
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            className="border-border-subtle flex flex-col gap-1.5 border-b py-3 last:border-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="font-medium">{project.name}</span>
              <StatusBadge domain="project" status={project.status} audience="portal" />
            </div>
            {project.description && (
              <p className="text-body text-muted-foreground">{project.description}</p>
            )}
            {project.nextStep && (
              <p className="text-small font-medium">{nextStepSentence(project.nextStep)}</p>
            )}
          </div>
        ))
      )}
    </DashboardSectionCard>
  );
}
