import { useMemo, useState } from 'react';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import type { ListQueryParams, SortOrder } from '@/types';

interface UseDataTableStateOptions {
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: SortOrder;
}

/**
 * Owns pagination / sorting / search UI state for a server-driven grid and
 * derives the flat query-params object that feature `*Queries` hooks send
 * straight through to the backend. No client-side slicing happens here.
 */
export function useDataTableState(options: UseDataTableStateOptions = {}) {
  const { initialPageSize = 25, initialSortBy, initialSortOrder = 'desc' } = options;

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(
    initialSortBy ? [{ field: initialSortBy, sort: initialSortOrder }] : [],
  );
  const [search, setSearch] = useState('');

  const queryParams = useMemo<ListQueryParams>(() => {
    const sort = sortModel[0];
    return {
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      sortBy: sort?.field,
      sortOrder: (sort?.sort ?? undefined) as SortOrder | undefined,
      search: search || undefined,
    };
  }, [paginationModel, sortModel, search]);

  return {
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
    search,
    setSearch,
    queryParams,
  };
}
