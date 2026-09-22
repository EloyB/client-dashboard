import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getProjectById, listSelectableClients } from '@/features/projects/queries';
import { AccessError } from '@/lib/access';
import { parseDateOnly } from '@/lib/utils';
import { ProjectForm } from '../../ProjectForm';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { project } = detail;
  const clients = await listSelectableClients(await headers());

  return (
    <ProjectForm
      projectId={project.id}
      projectName={project.name}
      currentStatus={project.status}
      clients={clients}
      defaultValues={{
        clientId: project.clientId,
        name: project.name,
        description: project.description ?? '',
        websiteUrl: project.websiteUrl ?? '',
        status: project.status,
        startDate: parseDateOnly(project.startDate),
        dueDate: parseDateOnly(project.dueDate),
      }}
    />
  );
}
