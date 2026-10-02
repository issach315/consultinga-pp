import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Alert, Box, Button, Divider, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { LabeledField } from '@/components/wizard/LabeledField';
import { PhoneNumberField } from '@/components/phone-number-field';
import type { Tenant } from '@/features/tenants/types/tenant.types';
import { ApiError } from '@/types';
import { getRoleOptionsForTenantType } from '../../constants/roles';
import {
  DEPARTMENT_OPTIONS,
  DESIGNATION_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  WORK_LOCATION_OPTIONS,
  WORK_MODE_OPTIONS,
} from '../../constants/employmentOptions';
import { useUpdateTenantAdminEmployeeMutation } from '../../api/employeeQueries';
import { employeeEditSchema, type EmployeeEditFormValues } from '../../schema/employeeEditSchema';
import type { TenantEmployee } from '../../types/employee.types';

interface EmployeeEditTabProps {
  tenant: Tenant;
  employee: TenantEmployee;
  managerOptions: TenantEmployee[];
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

/** Blank strings persist as SQL NULL rather than an empty string. */
function orUndefined(value: string): string | undefined {
  return value.trim() === '' ? undefined : value;
}

export function EmployeeEditTab({ tenant, employee, managerOptions, onSuccess, onCancel }: EmployeeEditTabProps) {
  const roleOptions = useMemo(() => getRoleOptionsForTenantType(tenant.tenantType), [tenant.tenantType]);
  const updateEmployee = useUpdateTenantAdminEmployeeMutation(tenant.id, employee.id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      preferredName: employee.preferredName ?? '',
      personalEmail: employee.personalEmail ?? '',
      email: employee.email,
      phone: employee.phone ?? '',
      dateOfBirth: employee.dateOfBirth ?? '',
      gender: employee.gender ?? '',
      addressLine: employee.addressLine ?? '',
      city: employee.city ?? '',
      state: employee.state ?? '',
      postalCode: employee.postalCode ?? '',
      role: employee.role,
      department: employee.department ?? '',
      designation: employee.designation ?? '',
      employmentType: employee.employmentType ?? '',
      joiningDate: employee.joiningDate ?? '',
      reportingManagerId: employee.reportingManagerId ?? '',
      workLocation: employee.workLocation ?? '',
      workMode: employee.workMode ?? '',
    },
  });

  const onSubmit = async (values: EmployeeEditFormValues) => {
    setSubmitError(null);
    try {
      const updated = await updateEmployee.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        preferredName: orUndefined(values.preferredName ?? ''),
        personalEmail: orUndefined(values.personalEmail ?? ''),
        email: values.email,
        phone: orUndefined(values.phone ?? ''),
        dateOfBirth: orUndefined(values.dateOfBirth ?? ''),
        gender: orUndefined(values.gender ?? ''),
        addressLine: orUndefined(values.addressLine ?? ''),
        city: orUndefined(values.city ?? ''),
        state: orUndefined(values.state ?? ''),
        postalCode: orUndefined(values.postalCode ?? ''),
        role: values.role,
        department: orUndefined(values.department ?? ''),
        designation: orUndefined(values.designation ?? ''),
        employmentType: orUndefined(values.employmentType ?? ''),
        joiningDate: orUndefined(values.joiningDate ?? ''),
        reportingManagerId: orUndefined(values.reportingManagerId ?? ''),
        workLocation: orUndefined(values.workLocation ?? ''),
        workMode: orUndefined(values.workMode ?? ''),
      });
      onSuccess(`${updated.employeeId} updated.`);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to update this employee.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="subtitle1" fontWeight={700}>
        Edit employee
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update this employee's profile and employment information.
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Typography variant="subtitle2" fontWeight={700}>
        Profile Information
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Update personal and contact information.
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="First Name" required>
            <TextField
              fullWidth
              error={Boolean(errors.firstName)}
              helperText={errors.firstName?.message}
              {...register('firstName')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Last Name" required>
            <TextField
              fullWidth
              error={Boolean(errors.lastName)}
              helperText={errors.lastName?.message}
              {...register('lastName')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Preferred Name">
            <TextField fullWidth {...register('preferredName')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Personal Email">
            <TextField
              type="email"
              fullWidth
              error={Boolean(errors.personalEmail)}
              helperText={errors.personalEmail?.message}
              {...register('personalEmail')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Work Email" required>
            <TextField
              type="email"
              fullWidth
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PhoneNumberField name="phone" control={control} label="Phone Number" defaultCountry="IN" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Date of Birth">
            <TextField fullWidth type="date" slotProps={{ inputLabel: { shrink: true } }} {...register('dateOfBirth')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Gender">
            <Controller
              name="gender"
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
            <TextField fullWidth placeholder="Street / Area" {...register('addressLine')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <LabeledField label="City">
            <TextField fullWidth {...register('city')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <LabeledField label="State / Province">
            <TextField fullWidth {...register('state')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <LabeledField label="Postal Code">
            <TextField fullWidth {...register('postalCode')} />
          </LabeledField>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={700}>
        Employment Information
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Update the employee's organizational information.
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Employee ID">
            <TextField fullWidth disabled value={employee.employeeId} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Role" required>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth error={Boolean(errors.role)} helperText={errors.role?.message}>
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
          <LabeledField label="Department">
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
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
          <LabeledField label="Designation">
            <Controller
              name="designation"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
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
          <LabeledField label="Employment Type">
            <Controller
              name="employmentType"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
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
          <LabeledField label="Joining Date">
            <TextField fullWidth type="date" slotProps={{ inputLabel: { shrink: true } }} {...register('joiningDate')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LabeledField label="Reporting Manager">
            <Controller
              name="reportingManagerId"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select manager</MenuItem>
                  {managerOptions
                    .filter((manager) => manager.id !== employee.id)
                    .map((manager) => (
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
              name="workLocation"
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
              name="workMode"
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
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
