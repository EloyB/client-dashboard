'use client';

import { Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListRow } from '@/components/shared/ListRow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useOpenFile } from '@/components/shared/useOpenFile';
import { DocumentUploadSheet } from './documents/DocumentUploadSheet';
import { fileTypeTile } from './documents/fileTypeTile';
import type { DocumentWithFile } from '@/features/documents/queries';

/** Compact view of the project's documents — the full, filterable list lives at /app/projects/[id]/documents. */
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
          documents.map((document) => (
            // A plain clickable div, not a <button> — ListRow has no nested
            // interactive elements anymore (the old "Openen" button is gone),
            // so this can safely be the whole row's click target.
            <div
              key={document.id}
              role="button"
              tabIndex={0}
              onClick={() => open(document.id, document.fileId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') open(document.id, document.fileId);
              }}
              className="cursor-pointer"
            >
              <ListRow
                leading={
                  openingId === document.id ? (
                    <div className="flex size-9 shrink-0 items-center justify-center">
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : (
                    fileTypeTile(document.mimeType)
                  )
                }
                title={document.title}
                subtitle={
                  <span className="flex items-center gap-1.5">
                    <StatusBadge domain="documentType" type={document.type} />
                    <StatusBadge domain="document" visibleToClient={document.visibleToClient} />
                  </span>
                }
                className="border-border-subtle border-b py-3 last:border-0"
              />
            </div>
          ))
        )}
      </CardContent>

      <DocumentUploadSheet projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />
    </Card>
  );
}
