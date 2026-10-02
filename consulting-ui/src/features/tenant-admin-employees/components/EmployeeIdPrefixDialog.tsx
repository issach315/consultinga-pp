import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useUpdateEmployeeIdPrefixMutation } from '@/features/tenants/api/tenantQueries';
import type { Tenant } from '@/features/tenants/types/tenant.types';
import { ApiError } from '@/types';

const EMPLOYEE_ID_PREFIX_PATTERN = /^[A-Z]{2,6}$/;

interface EmployeeIdPrefixDialogProps {
  open: boolean;
  tenant: Tenant;
  onClose: () => void;
  onSaved: () => void;
}

export function EmployeeIdPrefixDialog({ open, tenant, onClose, onSaved }: EmployeeIdPrefixDialogProps) {
  const [prefix, setPrefix] = useState(tenant.employeeIdPrefix);
  const [error, setError] = useState<string | null>(null);
  const updatePrefix = useUpdateEmployeeIdPrefixMutation();
  const isValid = EMPLOYEE_ID_PREFIX_PATTERN.test(prefix);

  const handleSave = async () => {
    if (!isValid) return;
    setError(null);
    try {
      await updatePrefix.mutateAsync(prefix);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update the employee ID prefix.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Employee ID prefix</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          New employees get IDs like <strong>{prefix || 'DOM'}-EMP-00001</strong>. Changing the prefix
          doesn't affect existing employee IDs or the sequence counter.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label="Prefix"
          value={prefix}
          onChange={(event) => setPrefix(event.target.value.toUpperCase())}
          error={!isValid}
          helperText={isValid ? ' ' : '2–6 uppercase letters (e.g. DOM, USIT, HYB)'}
          slotProps={{ htmlInput: { maxLength: 6 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid} loading={updatePrefix.isPending}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
