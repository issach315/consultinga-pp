import { Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeFilters } from '../components/EmployeeFilters';

export function EmployeesPage() {
  const navigate = useNavigate();
  const { tableState, status, setStatus, employeesQuery } = useEmployees();

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage your organization's workforce."
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Employees' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/employees/new')}
          >
            New employee
          </Button>
        }
      />

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
    </>
  );
}

export default EmployeesPage;
