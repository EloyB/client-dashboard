'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/shared/DataTable';
import { DocumentDownloadButton } from '@/components/shared/DocumentDownloadButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { fileTypeTile } from '@/components/shared/fileTypeTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import type { DocumentType } from '@/db/schema';
import { deleteDocument, updateDocumentVisibility } from '@/features/documents/actions';
import type { DocumentWithFile } from '@/features/documents/queries';

const typeLabels: Record<DocumentType, string> = {
  invoice: 'Factuur',
  quote: 'Offerte',
  contract: 'Contract',
  other: 'Andere',
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} kB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function VisibilityToggle({ document }: { document: DocumentWithFile }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function toggle() {
    setIsSaving(true);
    try {
      const result = await updateDocumentVisibility({
        documentId: document.id,
        visibleToClient: !document.visibleToClient,
      });
      if (!result.success) {
        showErrorToast('Zichtbaarheid wijzigen mislukt', result.formError);
        return;
      }
      showSuccessToast(
        result.data.visibleToClient ? 'Gedeeld met de klant' : 'Niet langer gedeeld',
      );
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={isSaving} className="inline-flex items-center">
      {isSaving ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : (
        <StatusBadge domain="document" visibleToClient={document.visibleToClient} />
      )}
    </button>
  );
}

function RowActions({ document }: { document: DocumentWithFile }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteDocument({ documentId: document.id });
      if (!result.success) {
        showErrorToast('Verwijderen mislukt', result.formError);
        return;
      }
      showSuccessToast('Document verwijderd');
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Meer acties">
            <MoreHorizontal strokeWidth={1.75} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 strokeWidth={1.75} />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Document verwijderen?"
        description={`${document.title} wordt definitief verwijderd, ook uit de opslag.`}
        confirmLabel={isDeleting ? 'Bezig...' : 'Verwijderen'}
        confirmIcon={Trash2}
        variant="destructive"
        confirmationText={document.title}
        onConfirm={handleDelete}
      />
    </>
  );
}

const typeFilter: DataTableFilter<DocumentWithFile> = {
  key: 'type',
  label: 'Soort',
  getValue: (document) => document.type,
  options: [
    { label: 'Alle', value: 'all' },
    { label: 'Factuur', value: 'invoice' },
    { label: 'Offerte', value: 'quote' },
    { label: 'Contract', value: 'contract' },
    { label: 'Andere', value: 'other' },
  ],
  variant: 'pills',
};

const columns: DataTableColumn<DocumentWithFile>[] = [
  {
    key: 'title',
    header: 'Titel',
    sortValue: (document) => document.title.toLowerCase(),
    cell: (document) => (
      <div className="flex items-center gap-3">
        {fileTypeTile(document.mimeType)}
        <div>
          <p className="font-medium">{document.title}</p>
          <p className="text-small text-muted-foreground">{document.filename}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Soort',
    sortValue: (document) => typeLabels[document.type],
    cell: (document) => <StatusBadge domain="documentType" type={document.type} />,
  },
  {
    key: 'size',
    header: 'Grootte',
    sortValue: (document) => document.size,
    cell: (document) => formatSize(document.size),
  },
  {
    key: 'createdAt',
    header: 'Toegevoegd',
    sortValue: (document) => document.createdAt.getTime(),
    cell: (document) => (
      <div>
        <p>{format(document.createdAt, 'd MMM yyyy', { locale: nl })}</p>
        {document.uploadedByName && (
          <p className="text-small text-muted-foreground">{document.uploadedByName}</p>
        )}
      </div>
    ),
  },
  {
    key: 'visibleToClient',
    header: 'Zichtbaarheid',
    cell: (document) => <VisibilityToggle document={document} />,
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    cell: (document) => (
      <div className="flex items-center justify-end gap-1">
        <DocumentDownloadButton fileId={document.fileId} />
        <RowActions document={document} />
      </div>
    ),
  },
];

function MobileCard({ document }: { document: DocumentWithFile }) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start gap-3">
        {fileTypeTile(document.mimeType)}
        <div className="flex-1">
          <p className="font-medium">{document.title}</p>
          <p className="text-small text-muted-foreground">
            {document.filename} · {formatSize(document.size)}
          </p>
        </div>
        <RowActions document={document} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StatusBadge domain="documentType" type={document.type} />
          <VisibilityToggle document={document} />
        </div>
        <DocumentDownloadButton fileId={document.fileId} />
      </div>
    </div>
  );
}

export function DocumentsTable({ documents }: { documents: DocumentWithFile[] }) {
  return (
    <DataTable
      columns={columns}
      rows={documents}
      getRowKey={(document) => document.id}
      renderMobileCard={(document) => <MobileCard document={document} />}
      filters={[typeFilter]}
      pageSize={10}
      emptyState={
        <EmptyState
          variant="filtered"
          title="Geen documenten met deze filters"
          description="Pas de filters aan om meer resultaten te zien."
        />
      }
    />
  );
}
