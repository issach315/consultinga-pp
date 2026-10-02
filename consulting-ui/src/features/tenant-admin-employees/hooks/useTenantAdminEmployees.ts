import { useEffect, useMemo, useState } from 'react';
import { useDataTableState } from '@/components/data-table';
import { useDebouncedValue } from '@/components/form-builder/engine/useDebouncedValue';
import { useTenantAdminEmployeeListQuery } from '../api/employeeQueries';
import type { TenantEmployeeStatus } from '../types/employee.types';

export function useTenantAdminEmployees(tenantId: string | undefined) {
  const tableState = useDataTableState({ initialSortBy: 'createdAt' });
  const [roles, setRoles] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<TenantEmployeeStatus[]>([]);

  // useDataTableState has no built-in debounce — search would otherwise refetch on every keystroke.
  const debouncedSearch = useDebouncedValue(tableState.search, 300);

  // Reset to page 1 whenever the effective filters change, so results
  // narrowing below the current page don't strand the user on an empty page.
  useEffect(() => {
    tableState.setPaginationModel((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to filter changes, not tableState identity
  }, [debouncedSearch, roles, statuses]);

  const queryParams = useMemo(
    () => ({
      ...tableState.queryParams,
      search: debouncedSearch || undefined,
      roles: roles.length ? roles : undefined,
      statuses: statuses.length ? statuses : undefined,
    }),
    [tableState.queryParams, debouncedSearch, roles, statuses],
  );

  const employeesQuery = useTenantAdminEmployeeListQuery(tenantId, queryParams);

  return {
    tableState,
    roles,
    setRoles,
    statuses,
    setStatuses,
    employeesQuery,
  };
}
