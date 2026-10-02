import { Box, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import type { PermissionMatrixModuleDef } from '@/components/form-builder';
import { getRoleLabel } from '../../constants/roles';
import type { EmployeeOnboardWizardFormValues } from '../../schema/employeeOnboardWizardSchema';
import { EmployeePermissionsTable } from './EmployeePermissionsTable';

interface AccessStepProps {
  modules: PermissionMatrixModuleDef[];
  enabledModules: string[];
}

export function AccessStep({ modules, enabledModules }: AccessStepProps) {
  const { watch } = useFormContext<EmployeeOnboardWizardFormValues>();
  const role = watch('employment.role');

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Access & Permissions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Permissions are automatically loaded from the selected role and can be customized.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          Role: <Typography component="span" fontWeight={700}>{role ? getRoleLabel(role) : '—'}</Typography>
        </Typography>
      </Box>

      <EmployeePermissionsTable modules={modules} enabledModules={enabledModules} />
    </>
  );
}
