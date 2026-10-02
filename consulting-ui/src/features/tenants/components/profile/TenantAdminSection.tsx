import { Box, Button, Divider, Paper, Stack, Tooltip, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import { StatusPill } from '@/components/data-table';
import { formatFullName } from '@/utils/formatters';
import type { Tenant } from '../../types/tenant.types';

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

interface TenantAdminSectionProps {
  tenant: Tenant;
  canManage: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  toggleActivePending: boolean;
}

export function TenantAdminSection({ tenant, canManage, onEdit, onToggleActive, toggleActivePending }: TenantAdminSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Tenant admin</Typography>
        {canManage && (
          <Button size="small" startIcon={<EditOutlinedIcon fontSize="small" />} onClick={onEdit}>
            Edit admin
          </Button>
        )}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Field label="Name" value={formatFullName(tenant.adminFirstName, tenant.adminLastName)} />
        <Field label="Email" value={tenant.adminEmail} />
        <Field label="Role" value="Tenant admin" />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Account status
          </Typography>
          <StatusPill label={tenant.isActive ? 'Active' : 'Inactive'} tone={tenant.isActive ? 'success' : 'default'} />
        </Box>
      </Box>

      {canManage && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color={tenant.isActive ? 'warning' : 'success'}
            startIcon={tenant.isActive ? <ToggleOffOutlinedIcon fontSize="small" /> : <ToggleOnOutlinedIcon fontSize="small" />}
            onClick={onToggleActive}
            loading={toggleActivePending}
          >
            {tenant.isActive ? 'Deactivate tenant access' : 'Activate tenant access'}
          </Button>
          <Tooltip title="Not available yet — no invitation endpoint">
            <span>
              <Button size="small" variant="outlined" startIcon={<MailOutlineIcon fontSize="small" />} disabled>
                Resend invitation
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Not available yet — no reset-access endpoint">
            <span>
              <Button size="small" variant="outlined" startIcon={<LockResetOutlinedIcon fontSize="small" />} disabled>
                Reset access
              </Button>
            </span>
          </Tooltip>
        </Stack>
      )}
    </Paper>
  );
}
