'use client';

import { Eye, EyeOff, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import { useOpenFile } from '@/components/shared/useOpenFile';
import { deleteDocument, updateDocumentVisibility } from '@/features/documents/actions';
import type { DocumentWithFile } from '@/features/documents/queries';
import { fileTypeTile } from './fileTypeTile';

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

function RowActions({ document }: { document: DocumentWithFile }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  async function toggleVisibility() {
    setIsTogglingVisibility(true);
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
      setIsTogglingVisibility(false);
    }
  }

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
    // Stops the row's own click (which opens the document) from firing when
    // the user is actually interacting with this menu.
    <div onClick={(event) => event.stopPropagation()} className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Meer acties"
            disabled={isTogglingVisibility}
          >
            {isTogglingVisibility ? (
              <Loader2 className="animate-spin" strokeWidth={1.75} />
            ) : (
              <MoreHorizontal strokeWidth={1.75} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={toggleVisibility}>
            {document.visibleToClient ? <EyeOff strokeWidth={1.75} /> : <Eye strokeWidth={1.75} />}
            {document.visibleToClient ? 'Niet langer delen' : 'Delen met klant'}
          </DropdownMenuItem>
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
    </div>
  );
}

export function DocumentsTable({ documents }: { documents: DocumentWithFile[] }) {
  const { open, openingId } = useOpenFile();
  const openDocument = (document: DocumentWithFile) => open(document.id, document.fileId);

  const columns: DataTableColumn<DocumentWithFile>[] = [
    {
      key: 'title',
      header: 'Document',
      sortValue: (document) => document.title.toLowerCase(),
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
      key: 'badges',
      header: 'Badges',
      cell: (document) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge domain="documentType" type={document.type} />
          <StatusBadge domain="document" visibleToClient={document.visibleToClient} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (document) => <RowActions document={document} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={documents}
      getRowKey={(document) => document.id}
      onRowClick={openDocument}
      renderMobileCard={(document) => (
        // A plain clickable div, not a <button> — RowActions renders its own
        // button (the "..." menu trigger) below, and nesting a button inside
        // a button is invalid HTML (see KanbanCard/AgendaCard for the same
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
            <RowActions document={document} />
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge domain="documentType" type={document.type} />
            <StatusBadge domain="document" visibleToClient={document.visibleToClient} />
          </div>
        </div>
      )}
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
