import { Alert, Grid, TextField, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import type { TenantWizardFormValues } from '../../schemas/tenantWizardSchema';
import { LabeledField } from '@/components/wizard/LabeledField';
import { PhoneNumberField } from '@/components/phone-number-field';

export function TenantAdminStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<TenantWizardFormValues>();

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Tenant Administrator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create the primary administrator who will manage this tenant.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="First name" required>
            <TextField
              fullWidth
              placeholder="Priya"
              error={Boolean(errors.tenantAdmin?.firstName)}
              helperText={errors.tenantAdmin?.firstName?.message}
              {...register('tenantAdmin.firstName')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Last name" required>
            <TextField
              fullWidth
              placeholder="Sharma"
              error={Boolean(errors.tenantAdmin?.lastName)}
              helperText={errors.tenantAdmin?.lastName?.message}
              {...register('tenantAdmin.lastName')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Work email" required>
            <TextField
              type="email"
              fullWidth
              placeholder="priya@acme.com"
              error={Boolean(errors.tenantAdmin?.workEmail)}
              helperText={errors.tenantAdmin?.workEmail?.message}
              {...register('tenantAdmin.workEmail')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Job title">
            <TextField fullWidth placeholder="Operations Manager" {...register('tenantAdmin.jobTitle')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <PhoneNumberField name="tenantAdmin.phone" control={control} label="Phone" defaultCountry="IN" />
        </Grid>
        <Grid size={12}>
          <Alert severity="info">
            A secure invitation email will be sent to this address once the tenant is created, so
            the administrator can set their own password.
          </Alert>
        </Grid>
      </Grid>
    </>
  );
}
