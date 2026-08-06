import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import type { PaginatedList, PaginationParams } from '@/types/api';

interface UsePaginatedQueryOptions<T> {
  queryKey: QueryKey;
  queryFn: (params: PaginationParams) => Promise<PaginatedList<T>>;
  pageSize?: number;
  search?: string;
  filterFn?: (item: T, search: string) => boolean;
}

interface UsePaginatedQueryResult<T> {
  items: T[];
  allItems: T[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  total: number;
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize = 20,
  search: initialSearch = '',
  filterFn,
}: UsePaginatedQueryOptions<T>): UsePaginatedQueryResult<T> {
  const [search, setSearch] = useState(initialSearch);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => queryFn({ page: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const items = useMemo(() => {
    if (!search || !filterFn) return allItems;
    const q = search.toLowerCase();
    return allItems.filter((item) => filterFn(item, q));
  }, [allItems, search, filterFn]);

  const total = data?.pages?.[0]?.pagination?.total ?? 0;

  return {
    items, allItems, isLoading, isError, isFetchingNextPage,
    hasNextPage: !!hasNextPage, fetchNextPage, refetch,
    search, setSearch, total,
  };
}
