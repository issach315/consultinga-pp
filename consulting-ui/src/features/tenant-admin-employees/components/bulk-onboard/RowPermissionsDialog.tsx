import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useController, useFormContext } from 'react-hook-form';
import type { ModulePermission, PermissionMatrixModuleDef } from '@/components/form-builder';
import type { BulkEmployeeOnboardFormValues } from '../../schema/bulkEmployeeOnboardSchema';
import { actionsForModule, PERMISSION_MATRIX_ACTIONS, toggleModuleAction } from '../onboard-wizard/permissionMatrixLogic';

interface RowPermissionsDialogProps {
  rowIndex: number;
  modules: PermissionMatrixModuleDef[];
  onClose: () => void;
}

/** Per-employee "Customize permissions" modal for the bulk onboarding table, matching the mockup's dialog. */
export function RowPermissionsDialog({ rowIndex, modules, onClose }: RowPermissionsDialogProps) {
  const { control, watch } = useFormContext<BulkEmployeeOnboardFormValues>();
  const { field } = useController({ name: `employees.${rowIndex}.permissions`, control });
  const value = (field.value ?? []) as ModulePermission[];
  const firstName = watch(`employees.${rowIndex}.firstName`);
  const lastName = watch(`employees.${rowIndex}.lastName`);
  const label = [firstName, lastName].filter(Boolean).join(' ') || `Employee ${rowIndex + 1}`;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Customize permissions — {label}
        <IconButton onClick={onClose} aria-label="Close dialog" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Start with the role defaults, then override access for this employee if necessary.
        </Typography>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onClose}>
          Apply permissions
        </Button>
      </DialogActions>
    </Dialog>
  );
}
