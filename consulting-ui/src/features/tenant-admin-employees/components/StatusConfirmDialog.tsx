import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useUpdateTenantAdminEmployeeStatusMutation } from '../api/employeeQueries';
import type { TenantEmployee } from '../types/employee.types';

interface StatusConfirmDialogProps {
  employee: TenantEmployee | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function StatusConfirmDialog({ employee, onClose, onSuccess }: StatusConfirmDialogProps) {
  const updateStatus = useUpdateTenantAdminEmployeeStatusMutation(employee?.tenantId ?? '');

  if (!employee) return null;

  const activating = employee.status === 'INACTIVE';
  const nextStatus = activating ? 'ACTIVE' : 'INACTIVE';

  const handleConfirm = async () => {
    const updated = await updateStatus.mutateAsync({ id: employee.id, status: nextStatus });
    onSuccess(`${updated.employeeId} ${activating ? 'activated' : 'deactivated'}.`);
    onClose();
  };

  return (
    <Dialog open={Boolean(employee)} onClose={onClose}>
      <DialogTitle>{activating ? 'Activate' : 'Deactivate'} employee?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {activating
            ? `${employee.firstName} ${employee.lastName} will regain access to the tenant.`
            : employee.status === 'INVITED'
              ? `${employee.firstName} ${employee.lastName}'s pending invitation will no longer be usable. You can reactivate them at any time.`
              : `${employee.firstName} ${employee.lastName} will immediately lose access to the tenant. You can reactivate them at any time.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updateStatus.isPending}>
          Cancel
        </Button>
        <Button
          color={activating ? 'success' : 'warning'}
          variant="contained"
          onClick={handleConfirm}
          loading={updateStatus.isPending}
        >
          {activating ? 'Activate' : 'Deactivate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
