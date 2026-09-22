import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { DetailHeader } from '@/components/shared/DetailHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getProjectById } from '@/features/projects/queries';
import { AccessError } from '@/lib/access';

// Thin placeholder: the real detail page (tabs for tickets/agenda/documents/
// tasks, plus its own edit action) is slice 3b. This exists only so
// create/edit and the client's project list have somewhere valid to link to
// in the meantime — editing happens from the projects list in 3a.
export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let detail;
  try {
    detail = await getProjectById(await headers(), id);
  } catch (error) {
    if (error instanceof AccessError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const { project, clientName } = detail;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Projecten', href: '/app/projects' }, { label: project.name }]}
        title={project.name}
        badge={<StatusBadge domain="project" status={project.status} />}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Projectdetail"
          description={`${clientName} · komt in een latere sessie (taken, tickets, agenda, documenten).`}
        />
      </div>
    </>
  );
}
