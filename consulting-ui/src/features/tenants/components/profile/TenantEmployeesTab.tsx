import { Stack } from '@mui/material';
import { EmployeeTable } from '@/features/employees/components/EmployeeTable';
import { EmployeeFilters } from '@/features/employees/components/EmployeeFilters';
import { useTenantEmployees } from '../../hooks/useTenantEmployees';

interface TenantEmployeesTabProps {
  tenantId: string;
}

export function TenantEmployeesTab({ tenantId }: TenantEmployeesTabProps) {
  const { tableState, status, setStatus, employeesQuery } = useTenantEmployees(tenantId);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <EmployeeFilters status={status} onStatusChange={setStatus} />
      </Stack>

      <EmployeeTable
        rows={employeesQuery.data?.items ?? []}
        rowCount={employeesQuery.data?.meta.totalItems ?? 0}
        loading={employeesQuery.isLoading || employeesQuery.isFetching}
        error={employeesQuery.error}
        onRetry={() => employeesQuery.refetch()}
        tableState={tableState}
      />
    </Stack>
  );
}
