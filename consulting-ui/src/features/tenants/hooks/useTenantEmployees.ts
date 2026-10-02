import { useMemo, useState } from 'react';
import { useDataTableState } from '@/components/data-table';
import { useEmployeeListQuery } from '@/features/employees/api/employeeQueries';
import type { EmployeeStatus } from '@/features/employees/types/employee.types';

export function useTenantEmployees(tenantId: string | undefined) {
  const tableState = useDataTableState({ initialSortBy: 'hireDate' });
  const [status, setStatus] = useState<EmployeeStatus | ''>('');

  const queryParams = useMemo(
    () => ({
      ...tableState.queryParams,
      status: status || undefined,
      tenantId,
    }),
    [tableState.queryParams, status, tenantId],
  );

  const employeesQuery = useEmployeeListQuery(queryParams, { enabled: Boolean(tenantId) });

  return {
    tableState,
    status,
    setStatus,
    employeesQuery,
  };
}
