'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { PortalTicketListRow } from '@/features/tickets/queries';
import type { TicketStatus } from '@/db/schema';

const statusOrder: TicketStatus[] = ['new', 'in_progress', 'resolved', 'closed'];

const statusLabels: Record<TicketStatus, string> = {
  new: 'Nieuw',
  in_progress: 'In behandeling',
  resolved: 'Opgelost',
  closed: 'Gesloten',
};

const emptyCopyByStatus: Record<TicketStatus, { title: string; description: string }> = {
  new: {
    title: 'Geen nieuwe meldingen',
    description: 'Al uw meldingen zijn opgepikt. Zodra u iets nieuws meldt, verschijnt het hier.',
  },
  in_progress: {
    title: 'Niets in behandeling',
    description: 'Er is momenteel geen melding waar wij aan werken.',
  },
  resolved: {
    title: 'Nog niets opgelost',
    description: 'Zodra wij een melding oplossen, vindt u ze hier terug.',
  },
  closed: {
    title: 'Geen afgesloten meldingen',
    description: 'Afgehandelde meldingen komen hier te staan, zodat u ze later kunt terugvinden.',
  },
};

function updatedAtLabel(date: Date): string {
  return format(date, 'd MMM yyyy, HH:mm', { locale: nl });
}

export function TicketsTable({ tickets }: { tickets: PortalTicketListRow[] }) {
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get('status') as TicketStatus | null;

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const ticket of tickets) seen.set(ticket.projectId, ticket.projectName);
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [tickets]);

  const columns: DataTableColumn<PortalTicketListRow>[] = [
    {
      key: 'title',
      header: 'Melding',
      sortValue: (row) => row.title,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <Link href={`/portal/tickets/${row.id}`} className="font-medium">
            {row.title}
          </Link>
          <p className="text-small text-muted-foreground">
            {row.reference} · gemeld door {row.reporterName}
          </p>
        </div>
      ),
    },
    {
      key: 'projectName',
      header: 'Project',
      sortValue: (row) => row.projectName,
      cell: (row) => row.projectName,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge domain="ticket" status={row.status} audience="portal" />,
    },
    {
      key: 'priority',
      header: 'Prioriteit',
      cell: (row) => <StatusBadge domain="priority" priority={row.priority} />,
    },
    {
      key: 'updatedAt',
      header: 'Laatste update',
      sortValue: (row) => row.updatedAt.toISOString(),
      cell: (row) => <span className="text-muted-foreground">{updatedAtLabel(row.updatedAt)}</span>,
    },
  ];

  const filters: DataTableFilter<PortalTicketListRow>[] = [
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
      key: 'projectId',
      label: 'Alle projecten',
      getValue: (row) => row.projectId,
      variant: 'select',
      options: [{ value: 'all', label: 'Alle projecten' }, ...projectOptions],
    },
  ];

  const emptyCopy =
    activeStatus && emptyCopyByStatus[activeStatus] ? emptyCopyByStatus[activeStatus] : null;

  return (
    <DataTable
      columns={columns}
      rows={tickets}
      getRowKey={(row) => row.id}
      getRowHref={(row) => `/portal/tickets/${row.id}`}
      filters={filters}
      emptyState={
        <EmptyState
          variant="filtered"
          title={emptyCopy?.title ?? 'Geen meldingen met deze filters'}
          description={emptyCopy?.description ?? 'Pas de filters aan om resultaten te zien.'}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/portal/tickets/new">Bug melden</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/portal/tickets">Alle meldingen tonen</Link>
              </Button>
            </div>
          }
        />
      }
      renderMobileCard={(row) => (
        <Link href={`/portal/tickets/${row.id}`} className="block">
          <div className="border-border-subtle bg-card flex flex-col gap-2 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-small text-muted-foreground font-mono">{row.reference}</span>
              <StatusBadge domain="ticket" status={row.status} audience="portal" />
            </div>
            <p className="font-medium">{row.title}</p>
            <p className="text-small text-muted-foreground">
              {row.projectName} · {row.reporterName}
            </p>
            <div className="border-border-subtle flex items-center justify-between gap-2 border-t pt-2">
              <span className="text-small text-muted-foreground">
                {updatedAtLabel(row.updatedAt)}
              </span>
              <StatusBadge domain="priority" priority={row.priority} />
            </div>
          </div>
        </Link>
      )}
    />
  );
}
