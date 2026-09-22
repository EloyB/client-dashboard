import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataList, type DataListItem } from '@/components/shared/DataList';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { listActivityForProject } from '@/features/activity/queries';
import { getProjectById } from '@/features/projects/queries';
import { AccessError, requireAdmin } from '@/lib/access';
import { cn, parseDateOnly } from '@/lib/utils';
import { DocumentsTabPlaceholder } from './DocumentsTabPlaceholder';
import { OverviewTab } from './OverviewTab';
import { ProjectDetailHeader } from './ProjectDetailHeader';
import { ProjectDetailTabs } from './ProjectDetailTabs';
import { TasksTabPlaceholder } from './TasksTabPlaceholder';
import { TicketsTabPlaceholder } from './TicketsTabPlaceholder';

function formatDate(date: Date | undefined): string {
  return date ? format(date, 'd MMMM yyyy', { locale: nl }) : '—';
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestHeaders = await headers();

  let detail;
  try {
    detail = await getProjectById(requestHeaders, id);
  } catch (error) {
    if (error instanceof AccessError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const { project, clientName } = detail;
  const admin = await requireAdmin(requestHeaders);
  const activity = await listActivityForProject(admin, project.id);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isOverdue =
    project.dueDate !== null &&
    project.dueDate < today &&
    project.status !== 'completed' &&
    project.status !== 'archived';

  const projectDetails: DataListItem[] = [
    {
      label: 'Klant',
      value: (
        <Link href={`/app/clients/${project.clientId}`} className="text-primary underline">
          {clientName}
        </Link>
      ),
    },
    {
      label: 'Website',
      value: project.websiteUrl ? (
        <a
          href={project.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {project.websiteUrl}
        </a>
      ) : (
        '—'
      ),
    },
    { label: 'Startdatum', value: formatDate(parseDateOnly(project.startDate)) },
    {
      label: 'Oplevering',
      value: (
        <span className={cn(isOverdue && 'text-destructive font-semibold')}>
          {formatDate(parseDateOnly(project.dueDate))}
        </span>
      ),
    },
    { label: 'Aangemaakt', value: formatDate(project.createdAt) },
    { label: 'Laatst gewijzigd', value: formatDate(project.updatedAt) },
  ];

  return (
    <>
      <ProjectDetailHeader
        breadcrumbs={[
          { label: 'Projecten', href: '/app/projects' },
          { label: clientName, href: `/app/clients/${project.clientId}` },
          { label: project.name },
        ]}
        title={project.name}
        badge={<StatusBadge domain="project" status={project.status} />}
        projectId={project.id}
        projectName={project.name}
        currentStatus={project.status}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectDetailTabs
              overzicht={<OverviewTab activity={activity} />}
              taken={<TasksTabPlaceholder />}
              tickets={<TicketsTabPlaceholder />}
              documenten={<DocumentsTabPlaceholder />}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="border-border-subtle border-b">
                <CardTitle>Projectgegevens</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <DataList items={projectDetails} />
                <div>
                  <p className="text-body text-muted-foreground mb-1">Beschrijving</p>
                  <p className="text-body">{project.description ?? 'Geen beschrijving.'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
