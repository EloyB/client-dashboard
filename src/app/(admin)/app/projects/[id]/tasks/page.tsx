import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getProjectById } from '@/features/projects/queries';
import { listTasksForProject } from '@/features/tasks/queries';
import { AccessError } from '@/lib/access';
import { TasksPageContent } from './TasksPageContent';

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
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

  const tasks = await listTasksForProject(requestHeaders, id);

  return <TasksPageContent tasks={tasks} projectId={id} projectName={detail.project.name} />;
}
