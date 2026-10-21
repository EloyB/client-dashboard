'use client';

import { Upload } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/shared/PageHeader';
import type { DocumentWithFile } from '@/features/documents/queries';
import { DocumentUploadSheet } from './DocumentUploadSheet';
import { DocumentsTable } from './DocumentsTable';

export function DocumentsPageContent({
  documents,
  projectId,
  projectName,
}: {
  documents: DocumentWithFile[];
  projectId: string;
  projectName: string;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sharedOnly, setSharedOnly] = useState(false);

  const sharedCount = useMemo(
    () => documents.filter((document) => document.visibleToClient).length,
    [documents],
  );
  const visibleRows = sharedOnly
    ? documents.filter((document) => document.visibleToClient)
    : documents;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Projecten', href: '/app/projects' },
          { label: projectName, href: `/app/projects/${projectId}` },
          { label: 'Documenten' },
        ]}
        title="Documenten"
        badges={
          documents.length > 0 && (
            <span className="text-body text-muted-foreground font-normal">
              {documents.length} {documents.length === 1 ? 'document' : 'documenten'} ·{' '}
              {sharedCount} gedeeld
            </span>
          )
        }
        primaryAction={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload strokeWidth={1.75} />
            Document uploaden
          </Button>
        }
      />

      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <DocumentsTable
          documents={visibleRows}
          extraControls={
            documents.length > 0 && (
              <label className="flex w-fit items-center gap-2">
                <Switch checked={sharedOnly} onCheckedChange={setSharedOnly} />
                <span className="text-body whitespace-nowrap">Alleen gedeeld met de klant</span>
              </label>
            )
          }
        />
      </div>

      <DocumentUploadSheet projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  );
}
