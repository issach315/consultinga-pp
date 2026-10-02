import { Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState } from '@/components/common';
import { useEmployeeDetailQuery, useUpdateEmployeeMutation } from '../api/employeeQueries';
import { EmployeeForm } from '../components/EmployeeForm';
import type { EmployeeFormValues } from '../schemas/employeeSchema';

export function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const employeeQuery = useEmployeeDetailQuery(id);
  const updateEmployee = useUpdateEmployeeMutation(id ?? '');

  const handleSubmit = async (values: EmployeeFormValues) => {
    await updateEmployee.mutateAsync(values);
  };

  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Employees', path: '/employees' },
    {
      label: employeeQuery.data
        ? `${employeeQuery.data.firstName} ${employeeQuery.data.lastName}`
        : 'Details',
    },
  ];

  return (
    <>
      <PageHeader title="Employee details" breadcrumbs={breadcrumbs} />

      {employeeQuery.isLoading && <LoadingState variant="card" />}

      {employeeQuery.isError && (
        <ErrorState message={employeeQuery.error.message} onRetry={() => employeeQuery.refetch()} />
      )}

      {employeeQuery.isSuccess && !employeeQuery.data && (
        <EmptyState
          title="Employee not found"
          action={{ label: 'Back to employees', onClick: () => navigate('/employees') }}
        />
      )}

      {employeeQuery.data && (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
          <EmployeeForm defaultValues={employeeQuery.data} onSubmit={handleSubmit} />
        </Paper>
      )}
    </>
  );
}

export default EmployeeDetailsPage;
