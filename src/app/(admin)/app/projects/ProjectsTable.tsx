'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { ProjectListRow } from '@/features/projects/queries';
import type { ProjectStatus } from '@/db/schema';
import { cn } from '@/lib/utils';

const statusLabels: Record<ProjectStatus, string> = {
  planned: 'Gepland',
  active: 'Actief',
  maintenance: 'Onderhoud',
  completed: 'Afgerond',
  archived: 'Gearchiveerd',
};

function searchValue(row: ProjectListRow): string {
  return row.name;
}

function ticketCountLabel(count: number): string {
  return count === 0 ? 'geen' : `${count} open`;
}

function nextDeadlineSortValue(row: ProjectListRow): string {
  return row.nextDeadline?.startsAt.toISOString() ?? '9999-12-31';
}

/**
 * A single boolean switch, kept in the URL like DataTable's own filters
 * (`?archived=1`) but managed here directly instead of going through
 * useDataTableUrlState's filter-key system — that system models a value with
 * an "all" default, whereas this needs a plain on/off default of off.
 */
function useShowArchived(): [boolean, (value: boolean) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showArchived = searchParams.get('archived') === '1';

  const setShowArchived = useCallback(
    (value: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set('archived', '1');
      else params.delete('archived');
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [showArchived, setShowArchived];
}

export function ProjectsTable({ projects }: { projects: ProjectListRow[] }) {
  const [showArchived, setShowArchived] = useShowArchived();

  const visibleProjects = useMemo(
    () => (showArchived ? projects : projects.filter((project) => project.status !== 'archived')),
    [projects, showArchived],
  );

  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const project of projects) seen.set(project.clientId, project.clientName);
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [projects]);

  const statusOptions = useMemo(() => {
    const base: ProjectStatus[] = ['planned', 'active', 'maintenance', 'completed'];
    const values = showArchived ? [...base, 'archived' as const] : base;
    return values.map((value) => ({ value, label: statusLabels[value] }));
  }, [showArchived]);

  const columns: DataTableColumn<ProjectListRow>[] = [
    {
      key: 'name',
      header: 'Project',
      sortValue: (row) => row.name,
      cell: (row) => (
        <Link href={`/app/projects/${row.id}/edit`} className="font-medium">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'clientName',
      header: 'Klant',
      sortValue: (row) => row.clientName,
      cell: (row) => row.clientName,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge domain="project" status={row.status} />,
    },
    {
      key: 'nextDeadline',
      header: 'Volgende deadline',
      sortValue: nextDeadlineSortValue,
      cell: (row) =>
        row.nextDeadline ? (
          <div>
            <p>{format(row.nextDeadline.startsAt, 'd MMM yyyy', { locale: nl })}</p>
            <p className="text-small text-muted-foreground">{row.nextDeadline.title}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
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
  ];

  const filters: DataTableFilter<ProjectListRow>[] = [
    {
      key: 'status',
      label: 'Status',
      getValue: (row) => row.status,
      options: [{ value: 'all', label: 'Alle' }, ...statusOptions],
    },
    {
      key: 'clientId',
      label: 'Alle klanten',
      getValue: (row) => row.clientId,
      variant: 'select',
      options: [{ value: 'all', label: 'Alle klanten' }, ...clientOptions],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-3">
        <Label htmlFor="show-archived-projects" className="font-normal">
          Gearchiveerde projecten tonen
        </Label>
        <Switch
          id="show-archived-projects"
          checked={showArchived}
          onCheckedChange={setShowArchived}
        />
      </div>

      <DataTable
        columns={columns}
        rows={visibleProjects}
        getRowKey={(row) => row.id}
        getRowHref={(row) => `/app/projects/${row.id}/edit`}
        searchValue={searchValue}
        searchPlaceholder="Zoek op projectnaam"
        filters={filters}
        emptyState={
          <EmptyState
            variant="filtered"
            title="Geen projecten met deze filters"
            description="Pas de zoekopdracht of filters aan om resultaten te zien."
          />
        }
        renderMobileCard={(row) => (
          <Link href={`/app/projects/${row.id}/edit`} className="block">
            <div className="border-border-subtle bg-card flex flex-col gap-2 rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-small text-muted-foreground">{row.clientName}</p>
                </div>
                <StatusBadge domain="project" status={row.status} />
              </div>
              <div className="flex items-center justify-between">
                {row.nextDeadline ? (
                  <p className="text-small">
                    {format(row.nextDeadline.startsAt, 'd MMM yyyy', { locale: nl })}
                  </p>
                ) : (
                  <p className="text-small text-muted-foreground">—</p>
                )}
                <p
                  className={cn('text-small', row.openTicketCount === 0 && 'text-muted-foreground')}
                >
                  {ticketCountLabel(row.openTicketCount)}
                </p>
              </div>
            </div>
          </Link>
        )}
      />
    </div>
  );
}
