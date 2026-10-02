import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useController, useFormContext } from 'react-hook-form';
import type { FieldArrayWithId } from 'react-hook-form';
import type { ModulePermission, PermissionMatrixModuleDef } from '@/components/form-builder';
import { StatusPill } from '@/components/data-table';
import type { BulkEmployeeOnboardFormValues } from '../../schema/bulkEmployeeOnboardSchema';
import { getRoleDefaultPermissionsMap } from '../../constants/roleDefaultPermissions';
import { getRoleLabel } from '../../constants/roles';
import { RowPermissionsDialog } from './RowPermissionsDialog';

interface RolesAccessStepTableProps {
  fields: FieldArrayWithId<BulkEmployeeOnboardFormValues, 'employees', 'id'>[];
  modules: PermissionMatrixModuleDef[];
  enabledModules: string[];
}

interface RoleAccessRowProps {
  index: number;
  defaultsByRole: Record<string, ModulePermission[]>;
  onCustomize: (index: number) => void;
}

function RoleAccessRow({ index, defaultsByRole, onCustomize }: RoleAccessRowProps) {
  const { control, watch } = useFormContext<BulkEmployeeOnboardFormValues>();
  const firstName = watch(`employees.${index}.firstName`);
  const lastName = watch(`employees.${index}.lastName`);
  const email = watch(`employees.${index}.email`);
  const { field: permissionsField } = useController({ name: `employees.${index}.permissions`, control });
  const role = watch(`employees.${index}.role`);

  const appliedForRole = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentPermissions = (permissionsField.value ?? []) as ModulePermission[];
    if (!role || currentPermissions.length > 0) return;
    if (appliedForRole.current === role) return;
    const defaults = defaultsByRole[role];
    if (defaults && defaults.length > 0) {
      appliedForRole.current = role;
      permissionsField.onChange(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the watched role changes
  }, [role]);

  const permissionCount = ((permissionsField.value ?? []) as ModulePermission[]).reduce(
    (sum, entry) => sum + entry.actions.length,
    0,
  );

  return (
    <TableRow>
      <TableCell sx={{ minWidth: 180 }}>
        <Typography variant="body2" fontWeight={600}>
          {[firstName, lastName].filter(Boolean).join(' ') || `Employee ${index + 1}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {email || '—'}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 130 }}>
        <StatusPill label={role ? getRoleLabel(role) : 'No role set'} tone={role ? 'info' : 'error'} />
      </TableCell>
      <TableCell sx={{ minWidth: 170 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 999,
              px: 1,
              py: 0.4,
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'text.secondary',
            }}
          >
            {permissionCount} selected
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => onCustomize(index)}
            sx={{ border: 'none', background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit', fontSize: '0.75rem', fontWeight: 700, p: 0 }}
          >
            Customize
          </Box>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

/** Step 2 — per-employee permission customization; role was already chosen on the Employee details step. */
export function RolesAccessStepTable({ fields, modules, enabledModules }: RolesAccessStepTableProps) {
  const [customizeIndex, setCustomizeIndex] = useState<number | null>(null);
  const defaultsByRole = getRoleDefaultPermissionsMap(enabledModules);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
        Roles & access
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Permissions default from each employee's role and can be customized individually where required.
      </Typography>

      <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
        <Table size="small" sx={{ minWidth: 620 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Access</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <RoleAccessRow key={field.id} index={index} defaultsByRole={defaultsByRole} onCustomize={setCustomizeIndex} />
            ))}
          </TableBody>
        </Table>
      </Box>

      {customizeIndex !== null && (
        <RowPermissionsDialog rowIndex={customizeIndex} modules={modules} onClose={() => setCustomizeIndex(null)} />
      )}
    </Box>
  );
}
