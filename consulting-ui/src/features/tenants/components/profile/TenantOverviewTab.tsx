import { Box, Divider, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { StatusPill } from '@/components/data-table';
import { formatFullName } from '@/utils/formatters';
import { getPlanDef, PLAN_TONE } from '../../constants/plans';
import type { Tenant } from '../../types/tenant.types';

interface StatCardProps {
  label: string;
  value: string;
  loading?: boolean;
}

function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, flex: '1 1 200px', minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {loading ? <Skeleton variant="text" width="60%" height={32} /> : <Typography variant="h5">{value}</Typography>}
    </Paper>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}

interface TenantOverviewTabProps {
  tenant: Tenant;
  employeeCount: number | undefined;
  employeeCountLoading: boolean;
}

export function TenantOverviewTab({ tenant, employeeCount, employeeCountLoading }: TenantOverviewTabProps) {
  const plan = getPlanDef(tenant.plan);

  return (
    <Stack spacing={3}>
      <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
        <StatCard label="Employees" value={`${employeeCount ?? 0} / ${tenant.employeeLimit}`} loading={employeeCountLoading} />
        <StatCard label="Enabled modules" value={String(tenant.enabledModules.length)} />
        <StatCard label="Plan" value={plan.id} />
        <StatCard label="Status" value={tenant.isActive ? 'Active' : 'Inactive'} />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Company information
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <SummaryRow label="Company name" value={tenant.displayName || tenant.legalCompanyName} />
          <SummaryRow label="Industry" value={tenant.industry ?? ''} />
          <SummaryRow label="Email" value={tenant.companyEmail ?? ''} />
          <SummaryRow label="Phone" value={tenant.phone ?? ''} />
          <SummaryRow label="Website" value={tenant.website ?? ''} />
          <SummaryRow label="Location" value={[tenant.city, tenant.state, tenant.country].filter(Boolean).join(', ')} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Tenant admin
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <SummaryRow label="Name" value={formatFullName(tenant.adminFirstName, tenant.adminLastName)} />
          <SummaryRow label="Email" value={tenant.adminEmail} />
          <SummaryRow label="Role" value="Tenant admin" />
          <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <StatusPill label={tenant.isActive ? 'Active' : 'Inactive'} tone={tenant.isActive ? 'success' : 'default'} />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Plan &amp; configuration
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
              Plan
            </Typography>
            <StatusPill label={plan.id} tone={PLAN_TONE[plan.id]} />
          </Stack>
          <SummaryRow label="Employee limit" value={String(tenant.employeeLimit)} />
          <SummaryRow label="Employees" value={employeeCountLoading ? '…' : String(employeeCount ?? 0)} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Modules
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {tenant.enabledModules.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No modules enabled.
            </Typography>
          ) : (
            <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75 }}>
              {tenant.enabledModules.map((key) => (
                <StatusPill key={key} label={key} tone="success" />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>
  );
}
