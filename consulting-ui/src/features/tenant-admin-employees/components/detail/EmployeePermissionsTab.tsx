import { useMemo, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { FormBuilder, type ModulePermission } from '@/components/form-builder';
import type { Tenant } from '@/features/tenants/types/tenant.types';
import { ApiError } from '@/types';
import { useUpdateTenantAdminEmployeePermissionsMutation } from '../../api/employeeQueries';
import { buildPermissionsOnlySchema } from '../../schema/employeeFormSchema';
import type { TenantEmployee } from '../../types/employee.types';
import { buildModuleRows } from '../../utils/buildModuleRows';

interface PermissionsFormValues {
  permissions: ModulePermission[];
}

interface EmployeePermissionsTabProps {
  tenant: Tenant;
  employee: TenantEmployee;
  onSuccess: (message: string) => void;
}

/** Same module × action matrix as "Manage permissions", embedded as a tab
 * instead of a drawer so it lives alongside the rest of the employee's record. */
export function EmployeePermissionsTab({ tenant, employee, onSuccess }: EmployeePermissionsTabProps) {
  const moduleRows = useMemo(() => buildModuleRows(tenant.enabledModules), [tenant.enabledModules]);
  const schema = useMemo(() => buildPermissionsOnlySchema(moduleRows), [moduleRows]);
  const updatePermissions = useUpdateTenantAdminEmployeePermissionsMutation(tenant.id);

  // Bumping this remounts FormBuilder, discarding unsaved edits back to initialValues — the "Reset" action.
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (values: PermissionsFormValues) => {
    try {
      const updated = await updatePermissions.mutateAsync({ id: employee.id, permissions: values.permissions });
      onSuccess(`Permissions updated for ${updated.employeeId}.`);
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Unable to update permissions.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage module access for {employee.firstName} {employee.lastName}.
        </Typography>
      </Stack>

      <FormBuilder<PermissionsFormValues>
        key={`${employee.id}-${formKey}`}
        schema={schema}
        mode="single"
        initialValues={{ permissions: employee.permissions }}
        onSubmit={handleSubmit}
        submitLabel="Save permissions"
      />

      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" onClick={() => setFormKey((prev) => prev + 1)}>
          Reset
        </Button>
      </Box>
    </Paper>
  );
}
