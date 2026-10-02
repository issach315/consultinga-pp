import type { ReactNode } from 'react';
import { Alert, Box, Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { StatusPill } from '@/components/data-table';
import type { Tenant } from '@/features/tenants/types/tenant.types';
import { getRoleLabel } from '../../constants/roles';
import type { TenantEmployee } from '../../types/employee.types';
import { buildModuleRows, getModuleRowLabel } from '../../utils/buildModuleRows';

interface ReviewRowProps {
  label: string;
  value: string;
}

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={2}
      sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

function ReviewBox({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {subtitle}
        </Typography>
      )}
      {!subtitle && <Box sx={{ mb: 1 }} />}
      {children}
    </Paper>
  );
}

interface EmployeeOverviewTabProps {
  employee: TenantEmployee;
  tenant: Tenant;
  managerName: string | null;
}

/** Read-only summary — profile, employment, and access, mirroring the
 * Employee Details preview's Overview tab as three review cards. */
export function EmployeeOverviewTab({ employee, tenant, managerName }: EmployeeOverviewTabProps) {
  const grantedActions = employee.permissions.reduce((sum, entry) => sum + entry.actions.length, 0);
  const possibleActions = buildModuleRows(tenant.enabledModules).length * 4;
  const grantPct = possibleActions > 0 ? Math.round((grantedActions / possibleActions) * 100) : 0;
  const grantedModules = employee.permissions.filter((entry) => entry.actions.length > 0);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 7 }}>
        <ReviewBox title="Profile information" subtitle="Basic employee information">
          <ReviewRow label="First name" value={employee.firstName} />
          <ReviewRow label="Last name" value={employee.lastName} />
          <ReviewRow label="Preferred name" value={employee.preferredName || '—'} />
          <ReviewRow label="Work email" value={employee.email} />
          <ReviewRow label="Personal email" value={employee.personalEmail || '—'} />
          <ReviewRow label="Phone number" value={employee.phone || '—'} />
          <ReviewRow label="Date of birth" value={employee.dateOfBirth || '—'} />
          <ReviewRow label="Gender" value={employee.gender || '—'} />
          <ReviewRow
            label="Address"
            value={
              [employee.addressLine, employee.city, employee.state, employee.postalCode]
                .filter(Boolean)
                .join(', ') || '—'
            }
          />
        </ReviewBox>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={2}>
          <ReviewBox title="Access summary" subtitle="Current role and permissions">
            <ReviewRow label="Role" value={getRoleLabel(employee.role)} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Permissions granted
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {grantedActions} of {possibleActions}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={grantPct}
                sx={{ height: 7, borderRadius: 99, mt: 1, bgcolor: 'action.hover' }}
              />
            </Box>
            {grantedModules.length > 0 && (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {grantedModules.map((entry) => (
                  <Stack key={entry.module} direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 110 }}>
                      {getModuleRowLabel(entry.module)}
                    </Typography>
                    {entry.actions.map((action) => (
                      <StatusPill key={action} label={action} tone="default" />
                    ))}
                  </Stack>
                ))}
              </Stack>
            )}
            <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
              Access is configurable from the Permissions tab.
            </Alert>
          </ReviewBox>

          <ReviewBox title="Employment information" subtitle="Organization and job details">
            <ReviewRow label="Designation" value={employee.designation || '—'} />
            <ReviewRow label="Department" value={employee.department || '—'} />
            <ReviewRow label="Employee ID" value={employee.employeeId} />
            <ReviewRow label="Employment type" value={employee.employmentType || '—'} />
            <ReviewRow label="Joining date" value={employee.joiningDate || '—'} />
            <ReviewRow label="Reporting manager" value={managerName || '—'} />
            <ReviewRow label="Work location" value={employee.workLocation || '—'} />
            <ReviewRow label="Work mode" value={employee.workMode || '—'} />
          </ReviewBox>
        </Stack>
      </Grid>
    </Grid>
  );
}
