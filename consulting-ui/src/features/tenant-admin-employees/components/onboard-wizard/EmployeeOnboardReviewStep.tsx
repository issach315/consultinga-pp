import { Alert, Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { EntityCell, StatusPill } from '@/components/data-table';
import { stringToColor } from '@/utils/avatarColor';
import { formatFullName } from '@/utils/formatters';
import { getRoleLabel } from '../../constants/roles';
import type { EmployeeOnboardWizardFormValues } from '../../schema/employeeOnboardWizardSchema';
import type { TenantEmployee } from '../../types/employee.types';
import { getModuleRowLabel } from '../../utils/buildModuleRows';

interface ReviewRowProps {
  label: string;
  value: string;
}

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

function ReviewBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

interface EmployeeOnboardReviewStepProps {
  managerOptions: TenantEmployee[];
}

export function EmployeeOnboardReviewStep({ managerOptions }: EmployeeOnboardReviewStepProps) {
  const { watch } = useFormContext<EmployeeOnboardWizardFormValues>();
  const values = watch();
  const fullName = formatFullName(values.profile.firstName, values.profile.lastName);
  const granted = values.access.permissions.filter((entry) => entry.actions.length > 0);
  const manager = managerOptions.find((option) => option.id === values.employment.reportingManagerId);

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Review & Invite
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the complete employee profile before creating the account.
      </Typography>

      <Box sx={{ mb: 2.5 }}>
        <EntityCell primary={fullName || 'Unnamed employee'} secondary={values.profile.workEmail} avatarColor={stringToColor(fullName || values.profile.workEmail)} />
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ReviewBox title="Profile">
            <ReviewRow label="Name" value={fullName || '—'} />
            <ReviewRow label="Work Email" value={values.profile.workEmail || '—'} />
            <ReviewRow label="Phone" value={values.profile.phone || '—'} />
            <ReviewRow label="Location" value={[values.profile.city, values.profile.state].filter(Boolean).join(', ') || '—'} />
          </ReviewBox>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ReviewBox title="Employment">
            <ReviewRow label="Role" value={values.employment.role ? getRoleLabel(values.employment.role) : '—'} />
            <ReviewRow label="Department" value={values.employment.department || '—'} />
            <ReviewRow label="Designation" value={values.employment.designation || '—'} />
            <ReviewRow label="Joining Date" value={values.employment.joiningDate || '—'} />
            <ReviewRow label="Reporting Manager" value={manager ? formatFullName(manager.firstName, manager.lastName) : '—'} />
          </ReviewBox>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ReviewBox title="Permissions">
            {granted.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No permissions assigned.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {granted.map((entry) => (
                  <Stack key={entry.module} direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 120 }}>
                      {getModuleRowLabel(entry.module)}
                    </Typography>
                    {entry.actions.map((action) => (
                      <StatusPill key={action} label={action} tone="default" />
                    ))}
                  </Stack>
                ))}
              </Stack>
            )}
          </ReviewBox>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ReviewBox title="Invitation">
            <ReviewRow label="Invitation" value="Send immediately" />
            <ReviewRow label="Email" value={values.profile.workEmail || '—'} />
            <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
              The employee will receive an invitation to activate their account.
            </Alert>
          </ReviewBox>
        </Grid>
      </Grid>
    </>
  );
}
