import { Box, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { LabeledField } from '@/components/wizard/LabeledField';
import { PhoneNumberField } from '@/components/phone-number-field';
import { GENDER_OPTIONS } from '../../constants/employmentOptions';
import type { EmployeeOnboardWizardFormValues } from '../../schema/employeeOnboardWizardSchema';
import { ProfilePhotoPicker } from './ProfilePhotoPicker';

interface ProfileStepProps {
  tenantId: string;
}

export function ProfileStep({ tenantId }: ProfileStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<EmployeeOnboardWizardFormValues>();

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Profile Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a complete employee profile for identification and internal records.
      </Typography>

      <Box sx={{ mb: 2.5 }}>
        <ProfilePhotoPicker tenantId={tenantId} />
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="First Name" required>
            <TextField
              fullWidth
              placeholder="John"
              error={Boolean(errors.profile?.firstName)}
              helperText={errors.profile?.firstName?.message}
              {...register('profile.firstName')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Last Name" required>
            <TextField
              fullWidth
              placeholder="Smith"
              error={Boolean(errors.profile?.lastName)}
              helperText={errors.profile?.lastName?.message}
              {...register('profile.lastName')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Preferred Name">
            <TextField fullWidth placeholder="Johnny" {...register('profile.preferredName')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Personal Email">
            <TextField
              type="email"
              fullWidth
              placeholder="john.personal@email.com"
              error={Boolean(errors.profile?.personalEmail)}
              helperText={errors.profile?.personalEmail?.message}
              {...register('profile.personalEmail')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Work Email" required>
            <TextField
              type="email"
              fullWidth
              placeholder="john@company.com"
              error={Boolean(errors.profile?.workEmail)}
              helperText={errors.profile?.workEmail?.message}
              {...register('profile.workEmail')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PhoneNumberField name="profile.phone" control={control} label="Phone Number" defaultCountry="IN" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Date of Birth">
            <TextField fullWidth type="date" slotProps={{ inputLabel: { shrink: true } }} {...register('profile.dateOfBirth')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Gender">
            <Controller
              name="profile.gender"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select gender</MenuItem>
                  {GENDER_OPTIONS.map((option) => (
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
          <LabeledField label="Address">
            <TextField fullWidth placeholder="Street / Area" {...register('profile.addressLine')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <LabeledField label="City">
            <TextField fullWidth placeholder="Hyderabad" {...register('profile.city')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <LabeledField label="State / Province">
            <TextField fullWidth placeholder="Telangana" {...register('profile.state')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <LabeledField label="Postal Code">
            <TextField fullWidth placeholder="500001" {...register('profile.postalCode')} />
          </LabeledField>
        </Grid>
      </Grid>
    </>
  );
}
