import { Grid, MenuItem, TextField, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  STATE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '../../constants/formOptions';
import type { TenantWizardFormValues } from '../../schemas/tenantWizardSchema';
import { LabeledField } from '@/components/wizard/LabeledField';

export function LocationStep() {
  const { register, control } = useFormContext<TenantWizardFormValues>();

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Business Location
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the tenant's address, timezone, and regional settings.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Country">
            <Controller
              name="location.country"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select country</MenuItem>
                  {COUNTRY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="State">
            <Controller
              name="location.state"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select state</MenuItem>
                  {STATE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="City">
            <TextField fullWidth placeholder="Hyderabad" {...register('location.city')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Postal code">
            <TextField fullWidth placeholder="500081" {...register('location.postalCode')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Timezone">
            <Controller
              name="location.timezone"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select timezone</MenuItem>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Currency">
            <Controller
              name="location.currency"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select currency</MenuItem>
                  {CURRENCY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={12}>
          <LabeledField label="Business address">
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Street, area, city, state, postal code"
              {...register('location.businessAddress')}
            />
          </LabeledField>
        </Grid>
      </Grid>
    </>
  );
}
