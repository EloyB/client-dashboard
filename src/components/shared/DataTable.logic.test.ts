import { describe, expect, it } from 'vitest';

import {
  filterBySearch,
  filterByValues,
  paginateRows,
  paginateRowsExact,
  sortRows,
  totalPages,
} from '@/components/shared/DataTable.logic';

type Row = { id: string; title: string; status: string; reportedAt: string };

const rows: Row[] = [
  { id: 'a', title: 'Contactformulier verzendt niet', status: 'new', reportedAt: '2026-09-16' },
  { id: 'b', title: 'Openingsuren kloppen niet', status: 'in_progress', reportedAt: '2026-09-01' },
  { id: 'c', title: 'Logo te klein op tablet', status: 'resolved', reportedAt: '2026-08-24' },
];

describe('filterBySearch', () => {
  it('keeps rows whose search value contains the query, case-insensitively', () => {
    const result = filterBySearch(rows, 'contact', (row) => row.title);
    expect(result.map((row) => row.id)).toEqual(['a']);
  });

  it('returns all rows for an empty or whitespace-only query', () => {
    expect(filterBySearch(rows, '   ', (row) => row.title)).toHaveLength(3);
  });
});

describe('filterByValues', () => {
  it('keeps only rows matching the active value', () => {
    const result = filterByValues(rows, 'new', (row) => row.status);
    expect(result.map((row) => row.id)).toEqual(['a']);
  });

  it('returns all rows when the active value is "all" or empty', () => {
    expect(filterByValues(rows, 'all', (row) => row.status)).toHaveLength(3);
    expect(filterByValues(rows, '', (row) => row.status)).toHaveLength(3);
  });
});

describe('sortRows', () => {
  it('sorts ascending by the given accessor', () => {
    const result = sortRows(rows, (row) => row.reportedAt, 'asc');
    expect(result.map((row) => row.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts descending by the given accessor', () => {
    const result = sortRows(rows, (row) => row.reportedAt, 'desc');
    expect(result.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the order unchanged when no accessor is given', () => {
    expect(sortRows(rows, undefined, 'asc').map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input array', () => {
    const copy = [...rows];
    sortRows(rows, (row) => row.reportedAt, 'asc');
    expect(rows).toEqual(copy);
  });
});

describe('paginateRows (cumulative, "load more")', () => {
  it('returns rows up to and including the given page', () => {
    expect(paginateRows(rows, 1, 2).map((row) => row.id)).toEqual(['a', 'b']);
    expect(paginateRows(rows, 2, 2).map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('paginateRowsExact (numbered pagination)', () => {
  it('returns only the rows for the given page', () => {
    expect(paginateRowsExact(rows, 1, 2).map((row) => row.id)).toEqual(['a', 'b']);
    expect(paginateRowsExact(rows, 2, 2).map((row) => row.id)).toEqual(['c']);
  });

  it('returns an empty array past the last page', () => {
    expect(paginateRowsExact(rows, 5, 2)).toEqual([]);
  });
});

describe('totalPages', () => {
  it('rounds up and never returns fewer than one page', () => {
    expect(totalPages(7, 2)).toBe(4);
    expect(totalPages(0, 2)).toBe(1);
  });
});
