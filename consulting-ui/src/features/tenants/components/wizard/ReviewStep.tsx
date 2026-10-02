import { Checkbox, Chip, FormHelperText, Grid, Paper, Stack, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { MODULE_DEFS } from '../../constants/plans';
import { buildTenantLoginUrl } from '@/utils/tenantSubdomain';
import type { TenantWizardFormValues } from '../../schemas/tenantWizardSchema';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value || '—'}
      </Typography>
    </Stack>
  );
}

export function ReviewStep() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<TenantWizardFormValues>();
  const values = watch();
  const enabledModules = MODULE_DEFS.filter((m) => values.modules.includes(m.key));

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Review &amp; Create Tenant
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the setup before creating the tenant workspace.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Company
            </Typography>
            <Row label="Legal name" value={values.companyDetails.legalCompanyName} />
            <Row label="Tenant code" value={values.companyDetails.tenantCode} />
            <Row
              label="Login URL"
              value={
                values.companyDetails.subdomain
                  ? buildTenantLoginUrl(values.companyDetails.subdomain)
                  : ''
              }
            />
            <Row label="Industry" value={values.companyDetails.industry ?? ''} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Location
            </Typography>
            <Row label="City" value={values.location.city ?? ''} />
            <Row label="State" value={values.location.state ?? ''} />
            <Row label="Country" value={values.location.country ?? ''} />
            <Row label="Currency" value={values.location.currency ?? ''} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Tenant Admin
            </Typography>
            <Row
              label="Name"
              value={`${values.tenantAdmin.firstName} ${values.tenantAdmin.lastName}`.trim()}
            />
            <Row label="Work email" value={values.tenantAdmin.workEmail} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Plan &amp; Limits
            </Typography>
            <Row label="Plan" value={values.configuration.plan} />
            <Row label="Employee limit" value={`${values.configuration.employeeLimit} employees`} />
          </Paper>
        </Grid>
        <Grid size={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Enabled modules
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {enabledModules.length === 0 ? (
                <Chip label="No modules enabled" size="small" />
              ) : (
                enabledModules.map((m) => <Chip key={m.key} label={m.name} size="small" color="primary" />)
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mt: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Controller
          name="confirmed"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              sx={{ mt: -1 }}
            />
          )}
        />
        <Typography variant="body2">
          I confirm the tenant information is correct and want to create this workspace.
        </Typography>
      </Paper>
      {errors.confirmed && <FormHelperText error>{errors.confirmed.message}</FormHelperText>}
    </>
  );
}
