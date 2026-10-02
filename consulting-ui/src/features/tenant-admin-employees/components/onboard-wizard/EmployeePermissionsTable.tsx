import { useEffect, useRef } from 'react';
import { Box, Checkbox, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useController, useFormContext } from 'react-hook-form';
import type { ModulePermission, PermissionMatrixModuleDef } from '@/components/form-builder';
import type { EmployeeOnboardWizardFormValues } from '../../schema/employeeOnboardWizardSchema';
import { getRoleDefaultPermissionsMap } from '../../constants/roleDefaultPermissions';
import { actionsForModule, PERMISSION_MATRIX_ACTIONS, toggleModuleAction } from './permissionMatrixLogic';

interface EmployeePermissionsTableProps {
  modules: PermissionMatrixModuleDef[];
  enabledModules: string[];
}

/** Module x CREATE/READ/UPDATE/DELETE permission grid for the onboarding wizard's Access step. */
export function EmployeePermissionsTable({ modules, enabledModules }: EmployeePermissionsTableProps) {
  const { control, watch } = useFormContext<EmployeeOnboardWizardFormValues>();
  const { field } = useController({ name: 'access.permissions', control });
  const value = (field.value ?? []) as ModulePermission[];
  const role = watch('employment.role');

  const defaultsByRole = getRoleDefaultPermissionsMap(enabledModules);
  const appliedForRole = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!role || value.length > 0) return;
    if (appliedForRole.current === role) return;
    const defaults = defaultsByRole[role];
    if (defaults && defaults.length > 0) {
      appliedForRole.current = role;
      field.onChange(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the watched role changes
  }, [role]);

  const selectAll = () =>
    field.onChange(modules.map((module) => ({ module: module.key, actions: [...PERMISSION_MATRIX_ACTIONS] })));
  const clearAll = () => field.onChange([]);

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mb: 1 }}>
        <Box
          component="button"
          type="button"
          onClick={selectAll}
          sx={{ border: 'none', background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit', fontSize: '0.75rem', p: 0 }}
        >
          Select all
        </Box>
        <Box
          component="button"
          type="button"
          onClick={clearAll}
          sx={{ border: 'none', background: 'none', color: 'text.secondary', cursor: 'pointer', font: 'inherit', fontSize: '0.75rem', p: 0 }}
        >
          Clear all
        </Box>
      </Stack>
      <Table size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
            {PERMISSION_MATRIX_ACTIONS.map((action) => (
              <TableCell key={action} align="center" sx={{ fontWeight: 700 }}>
                {action.charAt(0) + action.slice(1).toLowerCase()}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {modules.map((module) => {
            const moduleActions = actionsForModule(value, module.key);
            return (
              <TableRow key={module.key}>
                <TableCell sx={{ fontWeight: 600 }}>{module.name}</TableCell>
                {PERMISSION_MATRIX_ACTIONS.map((action) => (
                  <TableCell key={action} align="center">
                    <Checkbox
                      size="small"
                      checked={moduleActions.includes(action)}
                      onChange={(event) =>
                        field.onChange(toggleModuleAction(value, module.key, action, event.target.checked))
                      }
                      inputProps={{ 'aria-label': `${module.name} ${action}` }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {modules.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This tenant has no modules enabled yet.
        </Typography>
      )}
    </Box>
  );
}
