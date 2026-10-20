'use client';

import { Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { fileTypeTile } from '@/components/shared/fileTypeTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useOpenFile } from '@/components/shared/useOpenFile';
import { DocumentUploadSheet } from './documents/DocumentUploadSheet';
import { getDocumentColumns } from './documents/documentColumns';
import type { DocumentWithFile } from '@/features/documents/queries';

/** Compact view of the project's documents — same Document/Soort/Zichtbaarheid table as /app/projects/[id]/documents, just capped and without filters/sort/actions. */
export function DocumentsTab({
  documents,
  totalCount,
  sharedCount,
  projectId,
}: {
  /** The capped, most-recent rows to display — see PROJECT_DOCUMENTS_LIMIT in page.tsx. */
  documents: DocumentWithFile[];
  /** Counts across every document in the project, not just the capped rows shown here. */
  totalCount: number;
  sharedCount: number;
  projectId: string;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { open, openingId } = useOpenFile();
  const openDocument = (document: DocumentWithFile) => open(document.id, document.fileId);

  const columns = getDocumentColumns(openingId);

  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Documenten</CardTitle>
        {totalCount > 0 && (
          <p className="text-small text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'bestand' : 'bestanden'} · {sharedCount} gedeeld met de
            klant
          </p>
        )}
        {totalCount > 0 && (
          <CardAction className="flex flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={`/app/projects/${projectId}/documents`}>Alle documenten</Link>
            </Button>
            <Button size="sm" className="w-full sm:w-auto" onClick={() => setUploadOpen(true)}>
              <Upload strokeWidth={1.75} />
              Uploaden
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col">
        {totalCount === 0 ? (
          <EmptyState
            variant="invite"
            title="Nog geen documenten"
            description="Documenten voor dit project komen hier terecht."
            action={
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Upload strokeWidth={1.75} />
                Document uploaden
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={documents}
            getRowKey={(document) => document.id}
            onRowClick={openDocument}
            // No pagination control needed — `documents` is already capped
            // upstream (PROJECT_DOCUMENTS_LIMIT), so one page always fits.
            pageSize={documents.length}
            // This table already sits inside the "Documenten" Card, so its
            // own shadow-card would double up — a border reads as "part of
            // this card" instead of a second, nested card.
            tableCardClassName="shadow-none border border-border"
            renderMobileCard={(document) => (
              // A plain clickable div, not a <button> — no nested
              // interactive elements here, so this can safely be the whole
              // row's click target (see KanbanCard/AgendaCard for the same
              // pattern elsewhere in this codebase).
              <div
                role="button"
                tabIndex={0}
                onClick={() => openDocument(document)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') openDocument(document);
                }}
                className="border-border flex w-full flex-col gap-2 rounded-lg border p-3 text-left"
              >
                <div className="flex items-start gap-3">
                  {openingId === document.id ? (
                    <div className="flex size-9 shrink-0 items-center justify-center">
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : (
                    fileTypeTile(document.mimeType)
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{document.title}</p>
                    <p className="text-small text-muted-foreground truncate">{document.filename}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge domain="documentType" type={document.type} />
                  <StatusBadge domain="document" visibleToClient={document.visibleToClient} />
                </div>
              </div>
            )}
          />
        )}
      </CardContent>

      <DocumentUploadSheet projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />
    </Card>
  );
}
