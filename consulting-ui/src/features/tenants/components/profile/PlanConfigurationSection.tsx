import { Box, Divider, LinearProgress, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { StatusPill } from '@/components/data-table';
import { formatDate } from '@/utils/formatters';
import { getPlanDef, PLAN_TONE } from '../../constants/plans';
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

interface PlanConfigurationSectionProps {
  tenant: Tenant;
  employeeCount: number | undefined;
  employeeCountLoading: boolean;
}

export function PlanConfigurationSection({ tenant, employeeCount, employeeCountLoading }: PlanConfigurationSectionProps) {
  const plan = getPlanDef(tenant.plan);
  const usagePercent =
    employeeCount !== undefined ? Math.min(100, Math.round((employeeCount / tenant.employeeLimit) * 100)) : 0;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Plan &amp; configuration
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Plan
          </Typography>
          <StatusPill label={plan.id} tone={PLAN_TONE[plan.id]} />
        </Box>
        <Field label="Plan status" value={tenant.isActive ? 'Active' : 'Inactive'} />
        <Field label="Employee limit" value={tenant.employeeLimit.toLocaleString()} />
        <Field
          label="Current employees"
          value={employeeCountLoading ? '' : (employeeCount ?? 0).toLocaleString()}
        />
        <Field label="Start date" value={formatDate(tenant.createdAt)} />
        <Field label="Last updated" value={formatDate(tenant.updatedAt)} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Employee usage
      </Typography>
      {employeeCountLoading ? (
        <Skeleton variant="rounded" height={8} />
      ) : (
        <Stack spacing={0.5}>
          <LinearProgress
            variant="determinate"
            value={usagePercent}
            color={usagePercent >= 100 ? 'error' : usagePercent >= 80 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 999 }}
          />
          <Typography variant="caption" color="text.secondary">
            {(employeeCount ?? 0).toLocaleString()} of {tenant.employeeLimit.toLocaleString()} employees ({usagePercent}%)
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
