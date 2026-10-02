import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Alert, Box, Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { ApiError } from '@/types';
import { employeeSchema, type EmployeeFormValues } from '../schemas/employeeSchema';

const statusOptions: { value: EmployeeFormValues['status']; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On leave' },
];

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  submitLabel?: string;
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save employee',
}: EmployeeFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      jobTitle: '',
      department: '',
      status: 'active',
      hireDate: '',
      salary: 0,
      ...defaultValues,
    },
  });

  const handleFormSubmit = async (values: EmployeeFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to save employee.');
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={3}>
        {submitError && <Alert severity="error">{submitError}</Alert>}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First name"
              fullWidth
              error={Boolean(errors.firstName)}
              helperText={errors.firstName?.message}
              {...register('firstName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last name"
              fullWidth
              error={Boolean(errors.lastName)}
              helperText={errors.lastName?.message}
              {...register('lastName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Job title"
              fullWidth
              error={Boolean(errors.jobTitle)}
              helperText={errors.jobTitle?.message}
              {...register('jobTitle')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Department"
              fullWidth
              error={Boolean(errors.department)}
              helperText={errors.department?.message}
              {...register('department')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Status" fullWidth>
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Hire date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.hireDate)}
              helperText={errors.hireDate?.message}
              {...register('hireDate')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Salary"
              type="number"
              fullWidth
              error={Boolean(errors.salary)}
              helperText={errors.salary?.message}
              {...register('salary')}
            />
          </Grid>
        </Grid>

        <Box>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
