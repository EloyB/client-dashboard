'use client';

import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { AdminTicketListRow } from '@/features/tickets/queries.admin';
import type { Priority, TicketStatus } from '@/db/schema';

const statusOrder: TicketStatus[] = ['new', 'in_progress', 'resolved'];
const statusLabels: Record<TicketStatus, string> = {
  new: 'Nieuw',
  in_progress: 'In behandeling',
  resolved: 'Opgelost',
};

const priorityOrder: Priority[] = ['high', 'medium', 'low'];
const priorityLabels: Record<Priority, string> = {
  high: 'Hoog',
  medium: 'Middel',
  low: 'Laag',
};

function attachmentLabel(count: number): string | null {
  if (count === 0) return null;
  return count === 1 ? '1 bijlage' : `${count} bijlagen`;
}

function ageLabel(date: Date): string {
  return formatDistanceToNow(date, { locale: nl, addSuffix: true });
}

export function TicketsTable({ tickets }: { tickets: AdminTicketListRow[] }) {
  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const ticket of tickets) seen.set(ticket.clientId, ticket.clientName);
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [tickets]);

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const ticket of tickets) seen.set(ticket.projectId, ticket.projectName);
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [tickets]);

  const columns: DataTableColumn<AdminTicketListRow>[] = [
    {
      key: 'title',
      header: 'Ticket',
      sortValue: (row) => row.title,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <Link href={`/app/tickets/${row.id}`} className="flex items-center gap-2 font-medium">
            {row.status === 'new' && (
              <span className="bg-info size-2 shrink-0 rounded-full" aria-hidden="true" />
            )}
            {row.title}
          </Link>
          <p className="text-small text-muted-foreground">
            {row.reference}
            {attachmentLabel(row.attachmentCount)
              ? ` · ${attachmentLabel(row.attachmentCount)}`
              : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Klant · Project',
      sortValue: (row) => row.clientName,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span>{row.clientName}</span>
          <span className="text-small text-muted-foreground">{row.projectName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge domain="ticket" status={row.status} />,
    },
    {
      key: 'priority',
      header: 'Prioriteit',
      cell: (row) => <StatusBadge domain="priority" priority={row.priority} />,
    },
    {
      key: 'reporterName',
      header: 'Gemeld door',
      sortValue: (row) => row.reporterName,
      cell: (row) => row.reporterName,
    },
    {
      key: 'createdAt',
      header: 'Leeftijd',
      sortValue: (row) => row.createdAt.toISOString(),
      cell: (row) => <span className="text-muted-foreground">{ageLabel(row.createdAt)}</span>,
    },
  ];

  const filters: DataTableFilter<AdminTicketListRow>[] = [
    {
      key: 'status',
      label: 'Status',
      getValue: (row) => row.status,
      options: [
        { value: 'all', label: 'Alle' },
        ...statusOrder.map((status) => ({ value: status, label: statusLabels[status] })),
      ],
    },
    {
      key: 'priority',
      label: 'Prioriteit',
      getValue: (row) => row.priority,
      options: [
        { value: 'all', label: 'Alle' },
        ...priorityOrder.map((priority) => ({ value: priority, label: priorityLabels[priority] })),
      ],
    },
    {
      key: 'clientId',
      label: 'Alle klanten',
      getValue: (row) => row.clientId,
      variant: 'select',
      options: [{ value: 'all', label: 'Alle klanten' }, ...clientOptions],
    },
    {
      key: 'projectId',
      label: 'Alle projecten',
      getValue: (row) => row.projectId,
      variant: 'select',
      options: [{ value: 'all', label: 'Alle projecten' }, ...projectOptions],
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={tickets}
      getRowKey={(row) => row.id}
      getRowHref={(row) => `/app/tickets/${row.id}`}
      filters={filters}
      emptyState={
        <EmptyState
          variant="filtered"
          title="Geen tickets met deze filters"
          description="Pas de filters aan om resultaten te zien."
        />
      }
      renderMobileCard={(row) => (
        <Link href={`/app/tickets/${row.id}`} className="block">
          <div className="border-border-subtle bg-card flex flex-col gap-2 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-small text-muted-foreground font-mono">{row.reference}</span>
              <StatusBadge domain="ticket" status={row.status} />
            </div>
            <p className="flex items-center gap-2 font-medium">
              {row.status === 'new' && (
                <span className="bg-info size-2 shrink-0 rounded-full" aria-hidden="true" />
              )}
              {row.title}
            </p>
            <p className="text-small text-muted-foreground">
              {row.clientName} · {row.projectName}
            </p>
            <div className="border-border-subtle flex items-center justify-between gap-2 border-t pt-2">
              <span className="text-small text-muted-foreground">{ageLabel(row.createdAt)}</span>
              <StatusBadge domain="priority" priority={row.priority} />
            </div>
          </div>
        </Link>
      )}
    />
  );
}
