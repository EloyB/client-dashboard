import { headers } from 'next/headers';

import { PageHeader } from '@/components/shared/PageHeader';
import { listDocumentsForClient } from '@/features/documents/queries.portal';
import { requireClientUser } from '@/lib/access';
import { PortalDocumentsList } from './PortalDocumentsList';

export default async function PortalDocumentsPage() {
  const user = await requireClientUser(await headers());
  const documents = await listDocumentsForClient(user);

  return (
    <>
      <PageHeader
        title="Documenten"
        badges={
          documents.length > 0 && (
            <span className="text-body text-muted-foreground font-normal">
              {documents.length} {documents.length === 1 ? 'document' : 'documenten'}
            </span>
          )
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <PortalDocumentsList documents={documents} />
      </div>
    </>
  );
}
