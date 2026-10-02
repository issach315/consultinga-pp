import { Alert, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import type { SelectOption } from '@/components/form-builder';
import { LabeledField } from '@/components/wizard/LabeledField';
import {
  DEPARTMENT_OPTIONS,
  DESIGNATION_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_LOCATION_OPTIONS,
  WORK_MODE_OPTIONS,
} from '../../constants/employmentOptions';
import type { EmployeeOnboardWizardFormValues } from '../../schema/employeeOnboardWizardSchema';
import type { TenantEmployee } from '../../types/employee.types';

interface EmploymentStepProps {
  employeeIdPrefix: string;
  roleOptions: SelectOption[];
  managerOptions: TenantEmployee[];
}

export function EmploymentStep({ employeeIdPrefix, roleOptions, managerOptions }: EmploymentStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<EmployeeOnboardWizardFormValues>();

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Employment Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define the employee's organizational and employment details.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Employee ID">
            <TextField
              fullWidth
              disabled
              value={`Generated on creation, e.g. ${employeeIdPrefix}-EMP-00001`}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Joining Date" required>
            <TextField
              fullWidth
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.employment?.joiningDate)}
              helperText={errors.employment?.joiningDate?.message}
              {...register('employment.joiningDate')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Role" required>
            <Controller
              name="employment.role"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={Boolean(errors.employment?.role)}
                  helperText={errors.employment?.role?.message}
                >
                  <MenuItem value="">Select role</MenuItem>
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Department" required>
            <Controller
              name="employment.department"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={Boolean(errors.employment?.department)}
                  helperText={errors.employment?.department?.message}
                >
                  <MenuItem value="">Select department</MenuItem>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Designation" required>
            <Controller
              name="employment.designation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={Boolean(errors.employment?.designation)}
                  helperText={errors.employment?.designation?.message}
                >
                  <MenuItem value="">Select designation</MenuItem>
                  {DESIGNATION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Employment Type" required>
            <Controller
              name="employment.employmentType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={Boolean(errors.employment?.employmentType)}
                  helperText={errors.employment?.employmentType?.message}
                >
                  <MenuItem value="">Select employment type</MenuItem>
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Reporting Manager">
            <Controller
              name="employment.reportingManagerId"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select manager</MenuItem>
                  {managerOptions.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Work Location">
            <Controller
              name="employment.workLocation"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select location</MenuItem>
                  {WORK_LOCATION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Work Mode">
            <Controller
              name="employment.workMode"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select work mode</MenuItem>
                  {WORK_MODE_OPTIONS.map((option) => (
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
          <Alert severity="info" variant="outlined">
            New employees start with Invited status until they accept their invitation email.
          </Alert>
        </Grid>
      </Grid>
    </>
  );
}
