import { useMemo, useState } from 'react';
import { useDataTableState } from '@/components/data-table';
import { useEmployeeListQuery } from '../api/employeeQueries';
import type { EmployeeStatus } from '../types/employee.types';

export function useEmployees() {
  const tableState = useDataTableState({ initialSortBy: 'hireDate' });
  const [status, setStatus] = useState<EmployeeStatus | ''>('');

  const queryParams = useMemo(
    () => ({
      ...tableState.queryParams,
      status: status || undefined,
    }),
    [tableState.queryParams, status],
  );

  const employeesQuery = useEmployeeListQuery(queryParams);

  return {
    tableState,
    status,
    setStatus,
    employeesQuery,
  };
}
