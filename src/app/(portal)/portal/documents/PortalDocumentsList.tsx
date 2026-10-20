'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentDownloadButton } from '@/components/shared/DocumentDownloadButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { fileTypeTile } from '@/components/shared/fileTypeTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { DocumentType } from '@/db/schema';
import type { PortalDocumentRow } from '@/features/documents/queries.portal';
import { cn } from '@/lib/utils';

const typeOptions: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'invoice', label: 'Factuur' },
  { value: 'quote', label: 'Offerte' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Andere' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} kB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortalDocumentsList({ documents }: { documents: PortalDocumentRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeType = (searchParams.get('type') ?? 'all') as DocumentType | 'all';
  const activeProjectId = searchParams.get('projectId') ?? 'all';

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const document of documents) seen.set(document.projectId, document.projectName);
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [documents]);

  function setFilter(key: 'type' | 'projectId', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filteredDocuments = documents.filter((document) => {
    if (activeType !== 'all' && document.type !== activeType) return false;
    if (activeProjectId !== 'all' && document.projectId !== activeProjectId) return false;
    return true;
  });

  const groups = useMemo(() => {
    const byProject = new Map<string, { projectName: string; documents: PortalDocumentRow[] }>();
    for (const document of filteredDocuments) {
      const group = byProject.get(document.projectId);
      if (group) {
        group.documents.push(document);
      } else {
        byProject.set(document.projectId, {
          projectName: document.projectName,
          documents: [document],
        });
      }
    }
    return Array.from(byProject.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName),
    );
  }, [filteredDocuments]);

  if (documents.length === 0) {
    return (
      <EmptyState
        variant="invite"
        title="Nog geen documenten"
        description="Documenten die wij met u delen, zoals facturen en offertes, vindt u hier terug."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => {
            const active = activeType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter('type', option.value)}
                className={cn(
                  'text-body flex h-9 items-center gap-1.5 rounded-full border px-3.5 whitespace-nowrap',
                  active
                    ? 'border-transparent bg-neutral-900 text-white'
                    : 'border-border-strong bg-card text-foreground',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <Select value={activeProjectId} onValueChange={(value) => setFilter('projectId', value)}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Alle projecten">
            <SelectValue placeholder="Alle projecten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projecten</SelectItem>
            {projectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          variant="filtered"
          title="Geen documenten met deze filters"
          description="Pas de filters aan om meer resultaten te zien."
        />
      ) : (
        groups.map((group) => (
          <div key={group.projectName} className="border-border bg-card rounded-xl border">
            <div className="border-border-subtle flex items-center justify-between border-b px-4 py-3">
              <p className="font-display text-base font-semibold">{group.projectName}</p>
              <p className="text-small text-muted-foreground">
                {group.documents.length} {group.documents.length === 1 ? 'document' : 'documenten'}
              </p>
            </div>
            <div className="flex flex-col">
              {group.documents.map((document) => (
                <div
                  key={document.id}
                  className="border-border-subtle flex items-center gap-3 border-b px-4 py-3 last:border-0"
                >
                  {fileTypeTile(document.mimeType)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{document.title}</p>
                    <p className="text-small text-muted-foreground truncate">
                      {formatSize(document.size)} ·{' '}
                      {format(document.createdAt, 'd MMM yyyy', { locale: nl })}
                    </p>
                  </div>
                  <StatusBadge domain="documentType" type={document.type} />
                  <DocumentDownloadButton fileId={document.fileId} label="Downloaden" />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
