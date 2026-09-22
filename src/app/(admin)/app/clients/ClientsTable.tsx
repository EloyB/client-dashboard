'use client';

import { ChevronRight, FilterX } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { useDataTableUrlState } from '@/components/shared/useDataTableUrlState';
import type { ClientListRow } from '@/features/clients/queries';
import { cn, initialsFromName } from '@/lib/utils';

function searchValue(row: ClientListRow): string {
  return `${row.name} ${row.email}`;
}

function projectCountLabel(count: number): string {
  return count === 0 ? 'geen' : `${count} actief`;
}

function ticketCountLabel(count: number): string {
  return count === 0 ? 'geen' : `${count} open`;
}

function mobileSummary(row: ClientListRow): string {
  const projects =
    row.activeProjectCount === 0
      ? 'geen projecten'
      : `${row.activeProjectCount} ${row.activeProjectCount === 1 ? 'project' : 'projecten'}`;
  const tickets =
    row.openTicketCount === 0
      ? 'geen tickets'
      : `${row.openTicketCount} open ${row.openTicketCount === 1 ? 'ticket' : 'tickets'}`;
  return `${projects} · ${tickets}`;
}

const columns: DataTableColumn<ClientListRow>[] = [
  {
    key: 'name',
    header: 'Klant',
    sortValue: (row) => row.name,
    cell: (row) => (
      <Link href={`/app/clients/${row.id}`} className="flex items-center gap-3">
        <InitialsAvatar
          initials={initialsFromName(row.name)}
          className="bg-neutral-200 text-neutral-800"
        />
        <span className="font-medium">{row.name}</span>
      </Link>
    ),
  },
  {
    key: 'email',
    header: 'Contact',
    cell: (row) => <span className="text-muted-foreground">{row.email}</span>,
  },
  {
    key: 'activeProjectCount',
    header: 'Projecten',
    sortValue: (row) => row.activeProjectCount,
    cell: (row) => (
      <span className={cn(row.activeProjectCount === 0 && 'text-muted-foreground')}>
        {projectCountLabel(row.activeProjectCount)}
      </span>
    ),
  },
  {
    key: 'openTicketCount',
    header: 'Open tickets',
    sortValue: (row) => row.openTicketCount,
    cell: (row) => (
      <span className={cn(row.openTicketCount === 0 && 'text-muted-foreground')}>
        {ticketCountLabel(row.openTicketCount)}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'w-10',
    cell: () => <ChevronRight className="text-muted-foreground size-4" />,
  },
];

export function ClientsTable({ clients }: { clients: ClientListRow[] }) {
  const state = useDataTableUrlState([]);

  return (
    <DataTable
      columns={columns}
      rows={clients}
      getRowKey={(row) => row.id}
      getRowHref={(row) => `/app/clients/${row.id}`}
      searchValue={searchValue}
      searchPlaceholder="Zoek op naam of e-mailadres"
      emptyState={
        <EmptyState
          variant="filtered"
          title="Geen klanten met deze zoekopdracht"
          description="Er zijn geen klanten die overeenkomen met uw zoekopdracht."
          action={
            <Button variant="outline" size="sm" onClick={() => state.setSearch('')}>
              <FilterX strokeWidth={1.75} />
              Zoekopdracht wissen
            </Button>
          }
        />
      }
      renderMobileCard={(row) => (
        <Link href={`/app/clients/${row.id}`}>
          <Card className="flex-row items-center gap-3 p-3">
            <InitialsAvatar
              initials={initialsFromName(row.name)}
              className="bg-neutral-200 text-neutral-800"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{row.name}</p>
              <p className="text-small text-muted-foreground truncate">{row.email}</p>
              <p className="text-small text-muted-foreground">{mobileSummary(row)}</p>
            </div>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          </Card>
        </Link>
      )}
    />
  );
}
