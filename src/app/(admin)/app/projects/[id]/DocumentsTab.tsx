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
          // divide-y (not a per-row border-b/last:border-0) because each row
          // is now its own wrapper div around ListRow — with the border on
          // ListRow itself, "last:border-0" would match every row (each is
          // the lone child of its own wrapper), hiding every divider line.
          <div className="divide-border-subtle flex flex-col divide-y">
            {documents.map((document) => (
              // A plain clickable div, not a <button> — ListRow has no
              // nested interactive elements anymore (the old "Openen" button
              // is gone), so this can safely be the whole row's click
              // target. hover:bg-muted (full opacity, not /50) because the
              // card's white background makes the real <table>'s subtler
              // hover:bg-muted/50 nearly invisible here — this needs to read
              // clearly as "you can click this".
              <div
                key={document.id}
                role="button"
                tabIndex={0}
                onClick={() => open(document.id, document.fileId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ')
                    open(document.id, document.fileId);
                }}
                className="hover:bg-muted -mx-4 cursor-pointer rounded-lg px-4 transition-colors"
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
                  trailing={
                    <div className="flex shrink-0 items-center gap-1.5">
                      <StatusBadge domain="documentType" type={document.type} />
                      <StatusBadge domain="document" visibleToClient={document.visibleToClient} />
                    </div>
                  }
                  className="py-3"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <DocumentUploadSheet projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />
    </Card>
  );
}
