'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import type { SortDirection } from '@/components/shared/DataTable.logic';

export type DataTableUrlState = {
  search: string;
  setSearch: (value: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  sort: string | undefined;
  direction: SortDirection;
  setSort: (field: string) => void;
  setSortWithDirection: (field: string, direction: SortDirection) => void;
  page: number;
  setPage: (page: number) => void;
  loadMore: () => void;
};

/**
 * Keeps a DataTable's search, filters, sort and page in the URL (`q`, one
 * param per filter key, `sort`, `dir`, `page`) so a filtered list is
 * shareable, per docs/design/handoff CRUD-patronen.dc.html.
 */
export function useDataTableUrlState(filterKeys: string[]): DataTableUrlState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const search = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? undefined;
  const direction: SortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const key of filterKeys) {
      result[key] = searchParams.get(key) ?? 'all';
    }
    return result;
  }, [filterKeys, searchParams]);

  const setSearch = useCallback(
    (value: string) => {
      update((params) => {
        if (value) params.set('q', value);
        else params.delete('q');
        params.delete('page');
      });
    },
    [update],
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      update((params) => {
        if (value && value !== 'all') params.set(key, value);
        else params.delete(key);
        params.delete('page');
      });
    },
    [update],
  );

  const setSort = useCallback(
    (field: string) => {
      update((params) => {
        const currentSort = params.get('sort');
        const currentDirection = params.get('dir') === 'desc' ? 'desc' : 'asc';
        if (currentSort === field) {
          params.set('dir', currentDirection === 'asc' ? 'desc' : 'asc');
        } else {
          params.set('sort', field);
          params.set('dir', 'asc');
        }
      });
    },
    [update],
  );

  const setSortWithDirection = useCallback(
    (field: string, nextDirection: SortDirection) => {
      update((params) => {
        params.set('sort', field);
        params.set('dir', nextDirection);
      });
    },
    [update],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      update((params) => {
        if (nextPage > 1) params.set('page', String(nextPage));
        else params.delete('page');
      });
    },
    [update],
  );

  const loadMore = useCallback(() => setPage(page + 1), [page, setPage]);

  return {
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    direction,
    setSort,
    setSortWithDirection,
    page,
    setPage,
    loadMore,
  };
}
