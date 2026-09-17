export type SortDirection = 'asc' | 'desc';

export function filterBySearch<T>(rows: T[], query: string, searchValue: (row: T) => string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => searchValue(row).toLowerCase().includes(normalized));
}

export function filterByValues<T>(
  rows: T[],
  activeValue: string,
  getValue: (row: T) => string,
): T[] {
  if (!activeValue || activeValue === 'all') return rows;
  return rows.filter((row) => getValue(row) === activeValue);
}

export function sortRows<T>(
  rows: T[],
  sortValue: ((row: T) => string | number) | undefined,
  direction: SortDirection,
): T[] {
  if (!sortValue) return rows;
  const sorted = [...rows].sort((a, b) => {
    const valueA = sortValue(a);
    const valueB = sortValue(b);
    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = 0;
  const end = page * pageSize;
  return rows.slice(start, end);
}

export function paginateRowsExact<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function totalPages(rowCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(rowCount / pageSize));
}
