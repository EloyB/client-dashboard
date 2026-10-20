import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { listDocumentsForProject } from '@/features/documents/queries';
import { getProjectById } from '@/features/projects/queries';
import { AccessError, requireAdmin } from '@/lib/access';
import { DocumentsPageContent } from './DocumentsPageContent';

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const admin = await requireAdmin(requestHeaders);
  const documents = await listDocumentsForProject(admin, id);

  return (
    <DocumentsPageContent documents={documents} projectId={id} projectName={detail.project.name} />
  );
}
