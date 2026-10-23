import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';

import { DashboardSectionCard } from '@/components/shared/DashboardSectionCard';
import { DocumentDownloadButton } from '@/components/shared/DocumentDownloadButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { fileTypeTile } from '@/components/shared/fileTypeTile';
import { listDocumentsForClient } from '@/features/documents/queries.portal';
import { requireClientUser } from '@/lib/access';
import { formatFileSize } from '@/lib/utils';

const SECTION_LIMIT = 5;

export async function PortalDocumentsSection() {
  const user = await requireClientUser(await headers());
  const documents = (await listDocumentsForClient(user)).slice(0, SECTION_LIMIT);

  return (
    <DashboardSectionCard
      title="Uw documenten"
      actionLabel="Alle documenten"
      actionHref="/portal/documents"
    >
      {documents.length === 0 ? (
        <EmptyState
          variant="invite"
          title="Nog geen documenten"
          description="Documenten die wij met u delen, zoals facturen en offertes, vindt u hier terug."
        />
      ) : (
        documents.map((document) => (
          <div
            key={document.id}
            className="border-border-subtle flex items-center gap-3 border-b py-3 last:border-0"
          >
            {fileTypeTile(document.mimeType)}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{document.title}</p>
              <p className="text-small text-muted-foreground truncate">
                {formatFileSize(document.size)} ·{' '}
                {format(document.createdAt, 'd MMMM', { locale: nl })}
              </p>
            </div>
            <DocumentDownloadButton fileId={document.fileId} label="Openen" variant="outline" />
          </div>
        ))
      )}
    </DashboardSectionCard>
  );
}
