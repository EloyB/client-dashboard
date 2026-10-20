'use client';

import { Upload } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { DocumentDownloadButton } from '@/components/shared/DocumentDownloadButton';
import { fileTypeTile } from '@/components/shared/fileTypeTile';
import { ListRow } from '@/components/shared/ListRow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocumentUploadSheet } from './documents/DocumentUploadSheet';
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
            <ListRow
              key={document.id}
              leading={fileTypeTile(document.mimeType)}
              title={document.title}
              subtitle={
                <span className="flex items-center gap-1.5">
                  <StatusBadge domain="documentType" type={document.type} />
                  <StatusBadge domain="visibility" visibleToClient={document.visibleToClient} />
                </span>
              }
              trailing={<DocumentDownloadButton fileId={document.fileId} />}
              className="border-border-subtle border-b py-3 last:border-0"
            />
          ))
        )}
      </CardContent>

      <DocumentUploadSheet projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />
    </Card>
  );
}
