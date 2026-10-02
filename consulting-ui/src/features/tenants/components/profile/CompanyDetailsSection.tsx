import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { formatDate } from '@/utils/formatters';
import { StatusPill } from '@/components/data-table';
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

interface CompanyDetailsSectionProps {
  tenant: Tenant;
  canManage: boolean;
  onEdit: () => void;
}

export function CompanyDetailsSection({ tenant, canManage, onEdit }: CompanyDetailsSectionProps) {
  const address = [tenant.businessAddress, tenant.city, tenant.state, tenant.postalCode, tenant.country]
    .filter(Boolean)
    .join(', ');

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Company details</Typography>
        {canManage && (
          <Button size="small" startIcon={<EditOutlinedIcon fontSize="small" />} onClick={onEdit}>
            Edit
          </Button>
        )}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2.5,
        }}
      >
        <Field label="Company name" value={tenant.displayName || tenant.legalCompanyName} />
        <Field label="Legal name" value={tenant.legalCompanyName} />
        <Field label="Company type" value={tenant.tenantType} />
        <Field label="Industry" value={tenant.industry ?? ''} />
        <Field label="Email" value={tenant.companyEmail ?? ''} />
        <Field label="Phone" value={tenant.phone ?? ''} />
        <Field label="Website" value={tenant.website ?? ''} />
        <Field label="Tenant / registration code" value={tenant.tenantCode} />
        <Field label="City" value={tenant.city ?? ''} />
        <Field label="State" value={tenant.state ?? ''} />
        <Field label="Country" value={tenant.country ?? ''} />
        <Field label="ZIP / Postal code" value={tenant.postalCode ?? ''} />
        <Field label="Address" value={address} />
        <Field label="Created" value={formatDate(tenant.createdAt)} />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Tenant status
          </Typography>
          <StatusPill label={tenant.isActive ? 'Active' : 'Inactive'} tone={tenant.isActive ? 'success' : 'default'} />
        </Box>
      </Box>
    </Paper>
  );
}
