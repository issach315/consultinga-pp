import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { ApiError } from '@/types';
import { readStorage, removeStorage, writeStorage } from '@/utils/storage';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginFormValues } from '../schemas/authSchema';

const REMEMBERED_EMAIL_KEY = 'remembered-email';

interface LoginFormProps {
  onNotAvailable: (message: string) => void;
}

export function LoginForm({ onNotAvailable }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const rememberedEmail = readStorage<string>(REMEMBERED_EMAIL_KEY, '');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: rememberedEmail, password: '' },
  });

  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));

  useEffect(() => {
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
    }
  }, [rememberedEmail, setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      await login(values);
      if (rememberMe) {
        writeStorage(REMEMBERED_EMAIL_KEY, values.email);
      } else {
        removeStorage(REMEMBERED_EMAIL_KEY);
      }
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to sign in.');
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        {submitError && <Alert severity="error">{submitError}</Alert>}

        <Stack spacing={0.75}>
          <Typography component="label" htmlFor="login-email" variant="subtitle2">
            Work email
          </Typography>
          <TextField
            id="login-email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email')}
          />
        </Stack>

        <Stack spacing={0.75}>
          <Typography component="label" htmlFor="login-password" variant="subtitle2">
            Password
          </Typography>
          <TextField
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('password')}
          />
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Remember me
              </Typography>
            }
          />
          <Link
            component="button"
            type="button"
            variant="body2"
            underline="hover"
            onClick={() =>
              onNotAvailable('Contact your workspace administrator to reset your password.')
            }
          >
            Forgot password?
          </Link>
        </Stack>

        <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
          Sign in
        </Button>
      </Stack>
    </Box>
  );
}
