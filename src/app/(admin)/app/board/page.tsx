import { headers } from 'next/headers';

import { listProjects } from '@/features/projects/queries';
import { listAllTasksForAdmin } from '@/features/tasks/queries';
import { todayInBrussels } from '@/lib/utils';
import { AllTasksPageContent } from './AllTasksPageContent';

export default async function BoardPage() {
  const requestHeaders = await headers();

  const [tasks, projectRows] = await Promise.all([
    listAllTasksForAdmin(requestHeaders),
    listProjects(requestHeaders),
  ]);

  const projects = projectRows.map((project) => ({ id: project.id, name: project.name }));

  return <AllTasksPageContent tasks={tasks} today={todayInBrussels()} projects={projects} />;
}
