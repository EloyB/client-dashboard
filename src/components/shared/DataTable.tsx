'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  filterBySearch,
  filterByValues,
  paginateRows,
  paginateRowsExact,
  sortRows,
  totalPages,
} from '@/components/shared/DataTable.logic';
import { useDataTableUrlState } from '@/components/shared/useDataTableUrlState';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
};

export type DataTableFilter<T> = {
  key: string;
  label: string;
  getValue: (row: T) => string;
  options: { label: string; value: string }[];
};

/**
 * Responsive data list: a real table from `md` up, the same rows as touchable
 * cards below it. Never scrolls horizontally on mobile (see CLAUDE.md UI rules).
 * Search, filters, sort and page live in the URL (see useDataTableUrlState).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  getRowHref,
  renderMobileCard,
  searchValue,
  searchPlaceholder = 'Zoeken...',
  filters,
  pageSize = 5,
  emptyState,
  className,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Makes each desktop row navigable on click, in addition to whatever links its cells already contain. */
  getRowHref?: (row: T) => string;
  renderMobileCard: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: DataTableFilter<T>[];
  pageSize?: number;
  /** Shown instead of the table/cards when search/filters leave zero rows — the search and sort controls stay visible so the query can still be adjusted. */
  emptyState?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const filterKeys = useMemo(() => filters?.map((filter) => filter.key) ?? [], [filters]);
  const state = useDataTableUrlState(filterKeys);

  const searchedRows = searchValue ? filterBySearch(rows, state.search, searchValue) : rows;

  const filteredRows = (filters ?? []).reduce(
    (acc, filter) => filterByValues(acc, state.filters[filter.key], filter.getValue),
    searchedRows,
  );

  const sortColumn = columns.find((column) => column.key === state.sort);
  const sortedRows = sortRows(filteredRows, sortColumn?.sortValue, state.direction);
  const isEmpty = sortedRows.length === 0;

  const pageCount = totalPages(sortedRows.length, pageSize);
  const desktopRows = paginateRowsExact(sortedRows, state.page, pageSize);
  const mobileRows = paginateRows(sortedRows, state.page, pageSize);
  const hasMore = state.page < pageCount;

  const sortableColumns = columns.filter((column) => column.sortValue);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {(searchValue || filters || sortableColumns.length > 0) && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {searchValue && (
              <div className="relative sm:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={state.search}
                  onChange={(event) => state.setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-9"
                  aria-label={searchPlaceholder}
                />
              </div>
            )}
            {sortableColumns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-body text-muted-foreground whitespace-nowrap">Sorteren</span>
                <Select
                  value={state.sort ? `${state.sort}:${state.direction}` : undefined}
                  onValueChange={(value) => {
                    const [field, direction] = value.split(':') as [string, 'asc' | 'desc'];
                    state.setSortWithDirection(field, direction);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-56" aria-label="Sorteren">
                    <SelectValue placeholder="Sorteren op" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortableColumns.map((column) => (
                      <Fragment key={column.key}>
                        <SelectItem value={`${column.key}:asc`}>
                          {column.header} · oplopend
                        </SelectItem>
                        <SelectItem value={`${column.key}:desc`}>
                          {column.header} · aflopend
                        </SelectItem>
                      </Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {filters?.map((filter) => (
            <div key={filter.key} className="flex flex-wrap gap-2">
              {filter.options.map((option) => {
                const active = (state.filters[filter.key] ?? 'all') === option.value;
                const count =
                  option.value === 'all'
                    ? searchedRows.length
                    : filterByValues(searchedRows, option.value, filter.getValue).length;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => state.setFilter(filter.key, option.value)}
                    className={cn(
                      'text-body flex h-9 items-center gap-1.5 rounded-full border px-3.5 whitespace-nowrap',
                      active
                        ? 'border-transparent bg-neutral-900 text-white'
                        : 'border-border-strong bg-card text-foreground',
                    )}
                  >
                    {option.label}
                    <span
                      className={cn(
                        'text-small rounded-full px-1.5',
                        active ? 'bg-white/20' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {isEmpty && emptyState ? (
        emptyState
      ) : (
        <Card className="hidden overflow-hidden py-0 md:block">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow className="hover:bg-neutral-50">
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => state.setSort(column.key)}
                        className="inline-flex items-center gap-1 font-semibold"
                      >
                        {column.header}
                        {state.sort === column.key ? (
                          state.direction === 'asc' ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="text-muted-foreground size-3.5" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {desktopRows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  onClick={getRowHref ? () => router.push(getRowHref(row)) : undefined}
                  className={cn(getRowHref && 'cursor-pointer')}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!isEmpty && pageCount > 1 && (
        <div className="hidden items-center justify-between md:flex">
          <p className="text-small text-muted-foreground">
            Pagina {state.page} van {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={state.page <= 1}
              onClick={() => state.setPage(state.page - 1)}
              aria-label="Vorige pagina"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === state.page ? 'default' : 'outline'}
                size="icon"
                onClick={() => state.setPage(pageNumber)}
                aria-current={pageNumber === state.page ? 'page' : undefined}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              disabled={state.page >= pageCount}
              onClick={() => state.setPage(state.page + 1)}
              aria-label="Volgende pagina"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <div className={cn('flex flex-col gap-2 md:hidden', isEmpty && emptyState && 'hidden')}>
        {mobileRows.map((row) => (
          <div key={getRowKey(row)}>{renderMobileCard(row)}</div>
        ))}
        {hasMore && (
          <Button variant="outline" className="w-full" onClick={state.loadMore}>
            Meer laden
          </Button>
        )}
      </div>
    </div>
  );
}
