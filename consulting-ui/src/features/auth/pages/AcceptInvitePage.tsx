import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { LoadingState, ErrorState } from '@/components/common';
import { ApiError } from '@/types';
import { useAcceptInvitationMutation, useInvitationDetailQuery } from '../api/invitationQueries';
import { acceptInviteSchema, type AcceptInviteFormValues } from '../schemas/acceptInviteSchema';

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const invitationQuery = useInvitationDetailQuery(token);
  const acceptInvitation = useAcceptInvitationMutation(token ?? '');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: AcceptInviteFormValues) => {
    setSubmitError(null);
    try {
      await acceptInvitation.mutateAsync(values.password);
      // Full navigation so AuthProvider's bootstrap effect picks up the
      // fresh refresh token the same way it does after a normal page load.
      window.location.assign('/dashboard');
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to accept this invitation.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 440 }}>
        {invitationQuery.isLoading && <LoadingState variant="card" />}

        {invitationQuery.isError && (
          <ErrorState message="This invitation link is invalid or has expired." />
        )}

        {invitationQuery.data && (
          <>
            <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
              Welcome, {invitationQuery.data.firstName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set a password to activate your <strong>{invitationQuery.data.roleName}</strong> account
              for <strong>{invitationQuery.data.tenantName}</strong>.
            </Typography>

            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                {submitError && <Alert severity="error">{submitError}</Alert>}

                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  {...register('password')}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
                  Set password &amp; sign in
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default AcceptInvitePage;
