import { Loader2 } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import type { DataTableColumn } from '@/components/shared/DataTable';
import type { DocumentWithFile } from '@/features/documents/queries';
import { fileTypeTile } from './fileTypeTile';

/**
 * The "Document" / "Soort" / "Zichtbaarheid" columns shared by the full
 * document list (/app/projects/[id]/documents) and the compact Documenten
 * tab on project detail, so the compact tab genuinely looks like the same
 * table instead of its own improvised layout.
 */
export function getDocumentColumns(openingId: string | null): DataTableColumn<DocumentWithFile>[] {
  return [
    {
      key: 'title',
      header: 'Document',
      cell: (document) => (
        <div className="flex items-center gap-3">
          {openingId === document.id ? (
            <div className="flex size-9 shrink-0 items-center justify-center">
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            </div>
          ) : (
            fileTypeTile(document.mimeType)
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{document.title}</p>
            <p className="text-small text-muted-foreground truncate">{document.filename}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Soort',
      cell: (document) => <StatusBadge domain="documentType" type={document.type} />,
    },
    {
      key: 'visibleToClient',
      header: 'Zichtbaarheid',
      cell: (document) => (
        <StatusBadge domain="document" visibleToClient={document.visibleToClient} />
      ),
    },
  ];
}
