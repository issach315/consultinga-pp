import { Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { useCreateEmployeeMutation } from '../api/employeeQueries';
import { EmployeeForm } from '../components/EmployeeForm';
import type { EmployeeFormValues } from '../schemas/employeeSchema';

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const createEmployee = useCreateEmployeeMutation();

  const handleSubmit = async (values: EmployeeFormValues) => {
    const employee = await createEmployee.mutateAsync(values);
    navigate(`/employees/${employee.id}`, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="New employee"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Employees', path: '/employees' },
          { label: 'New' },
        ]}
      />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
        <EmployeeForm onSubmit={handleSubmit} submitLabel="Create employee" />
      </Paper>
    </>
  );
}

export default EmployeeCreatePage;
