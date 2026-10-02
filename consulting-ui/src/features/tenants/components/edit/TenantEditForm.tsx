import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOnOutlined';
import PaletteIcon from '@mui/icons-material/PaletteOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCardOutlined';
import AppsIcon from '@mui/icons-material/AppsOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { PhoneNumberField } from '@/components/phone-number-field';
import { ApiError } from '@/types';
import { getPlanDef, MODULE_DEFS, PLAN_DEFS, type TenantPlanId } from '../../constants/plans';
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  INDUSTRY_OPTIONS,
  STATE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '../../constants/formOptions';
import { TENANT_TYPE_OPTIONS } from '../../constants/tenantType';
import { tenantEditSchema, type TenantEditFormValues } from '../../schemas/tenantEditSchema';
import { FormSection } from './FormSection';
import { LogoPicker } from './LogoPicker';

const BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || 'localhost';

// Two equal columns from tablet up (768px), single column on mobile —
// matches every section's field layout for a consistent responsive feel.
const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 2.5,
  '@media (min-width:768px)': { gridTemplateColumns: '1fr 1fr' },
} as const;

const fullWidth = { gridColumn: { md: '1 / -1' } } as const;

interface TenantEditFormProps {
  defaultValues: TenantEditFormValues;
  onSubmit: (values: TenantEditFormValues) => Promise<void>;
}

export function TenantEditForm({ defaultValues, onSubmit }: TenantEditFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Scoped to this form only — bumps input height/font/label size a notch
  // above the app-wide compact default without touching the global theme.
  const outerTheme = useTheme();
  const formTheme = useMemo(
    () =>
      createTheme(outerTheme, {
        components: {
          MuiTextField: { defaultProps: { size: 'medium' } },
          MuiSelect: { defaultProps: { size: 'medium' } },
          MuiOutlinedInput: {
            styleOverrides: {
              root: { fontSize: '0.95rem' },
              input: { paddingTop: 14, paddingBottom: 14 },
            },
          },
          MuiInputLabel: {
            styleOverrides: { root: { fontSize: '0.95rem' } },
          },
          MuiMenuItem: {
            styleOverrides: { root: { fontSize: '0.95rem', minHeight: 44 } },
          },
        },
      }),
    [outerTheme],
  );

  const methods = useForm<TenantEditFormValues>({
    resolver: zodResolver(tenantEditSchema),
    defaultValues,
  });
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const plan = watch('configuration.plan');
  const employeeLimit = watch('configuration.employeeLimit');
  const modules = watch('modules');
  const planDef = getPlanDef(plan);

  const selectPlan = (id: TenantPlanId) => {
    setValue('configuration.plan', id, { shouldValidate: true });
    const nextPlanDef = getPlanDef(id);
    if (employeeLimit < nextPlanDef.min || employeeLimit > nextPlanDef.max) {
      setValue('configuration.employeeLimit', nextPlanDef.default, { shouldValidate: true });
    }
  };

  const toggleModule = (key: string, enabled: boolean) => {
    const next = enabled ? [...modules, key] : modules.filter((m) => m !== key);
    setValue('modules', next, { shouldDirty: true });
  };

  const handleFormSubmit = async (values: TenantEditFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to update tenant.');
    }
  };

  return (
    <ThemeProvider theme={formTheme}>
      <FormProvider {...methods}>
        <Box component="form" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {submitError}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ pb: { xs: 11, md: 0 } }}>
            <FormSection
              icon={<BusinessIcon />}
              title="Company Details"
              description="The organization that uses this platform."
            >
              <Box sx={fieldGrid}>
                <TextField
                  label="Legal company name"
                  required
                  fullWidth
                  sx={fullWidth}
                  error={Boolean(errors.companyDetails?.legalCompanyName)}
                  helperText={errors.companyDetails?.legalCompanyName?.message}
                  {...register('companyDetails.legalCompanyName')}
                />
                <TextField label="Display name" fullWidth {...register('companyDetails.displayName')} />
                <TextField
                  label="Tenant code"
                  required
                  fullWidth
                  error={Boolean(errors.companyDetails?.tenantCode)}
                  helperText={errors.companyDetails?.tenantCode?.message}
                  {...register('companyDetails.tenantCode')}
                />
                <TextField
                  label="Subdomain"
                  required
                  fullWidth
                  error={Boolean(errors.companyDetails?.subdomain)}
                  helperText={
                    errors.companyDetails?.subdomain?.message ||
                    `Tenant signs in at this-subdomain.${BASE_DOMAIN}`
                  }
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">.{BASE_DOMAIN}</InputAdornment>,
                    },
                  }}
                  {...register('companyDetails.subdomain')}
                />
                <Controller
                  name="companyDetails.industry"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Industry" fullWidth>
                      <MenuItem value="">Select industry</MenuItem>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="companyDetails.tenantType"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Tenant type"
                      required
                      fullWidth
                      error={Boolean(errors.companyDetails?.tenantType)}
                      helperText={errors.companyDetails?.tenantType?.message}
                    >
                      {TENANT_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField
                  label="Company email"
                  type="email"
                  fullWidth
                  error={Boolean(errors.companyDetails?.companyEmail)}
                  helperText={errors.companyDetails?.companyEmail?.message}
                  {...register('companyDetails.companyEmail')}
                />
                <PhoneNumberField name="companyDetails.phone" control={control} label="Phone" defaultCountry="IN" />
                <TextField label="Website" fullWidth {...register('companyDetails.website')} />
              </Box>
            </FormSection>

            <FormSection
              icon={<LocationOnIcon />}
              title="Business Location"
              description="Address, timezone, and regional settings."
            >
              <Box sx={fieldGrid}>
                <Controller
                  name="location.country"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Country" fullWidth>
                      <MenuItem value="">Select country</MenuItem>
                      {COUNTRY_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="location.state"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="State" fullWidth>
                      <MenuItem value="">Select state</MenuItem>
                      {STATE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField label="City" fullWidth {...register('location.city')} />
                <TextField label="Postal code" fullWidth {...register('location.postalCode')} />
                <Controller
                  name="location.timezone"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Timezone" fullWidth>
                      <MenuItem value="">Select timezone</MenuItem>
                      {TIMEZONE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="location.currency"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Currency" fullWidth>
                      <MenuItem value="">Select currency</MenuItem>
                      {CURRENCY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField
                  label="Business address"
                  fullWidth
                  multiline
                  minRows={3}
                  sx={fullWidth}
                  {...register('location.businessAddress')}
                />
              </Box>
            </FormSection>

            <FormSection
              icon={<PaletteIcon />}
              title="Branding"
              description="The tenant's identity inside the application."
            >
              <Stack spacing={3}>
                <LogoPicker />
                <Box sx={fieldGrid}>
                  <Controller
                    name="branding.primaryBrandColor"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Primary brand color
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <input
                            type="color"
                            value={field.value || '#343a40'}
                            onChange={field.onChange}
                            style={{
                              width: 52,
                              height: 44,
                              padding: 2,
                              border: '1px solid #ccc',
                              borderRadius: 8,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                            {field.value || '#343a40'}
                          </Typography>
                        </Stack>
                      </Box>
                    )}
                  />
                  <TextField label="Email sender name" fullWidth {...register('branding.emailSenderName')} />
                  <TextField
                    label="Support email"
                    type="email"
                    fullWidth
                    error={Boolean(errors.branding?.supportEmail)}
                    helperText={errors.branding?.supportEmail?.message}
                    {...register('branding.supportEmail')}
                  />
                </Box>
              </Stack>
            </FormSection>

            <FormSection
              icon={<CreditCardIcon />}
              title="Subscription"
              description="Plan and employee capacity for this tenant."
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 1.5,
                  mb: 2.5,
                  '@media (min-width:600px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
                }}
              >
                {PLAN_DEFS.map((planOption) => {
                  const selected = planOption.id === plan;
                  return (
                    <Box
                      key={planOption.id}
                      onClick={() => selectPlan(planOption.id)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        borderWidth: selected ? 2 : 1,
                        bgcolor: selected ? 'action.selected' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        {planOption.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {planOption.price}
                        {planOption.period} · {planOption.min.toLocaleString()}–
                        {planOption.max.toLocaleString()} employees
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              <Box sx={fieldGrid}>
                <TextField
                  type="number"
                  label="Employee limit"
                  value={employeeLimit}
                  onChange={(event) =>
                    setValue('configuration.employeeLimit', Number(event.target.value), {
                      shouldValidate: true,
                    })
                  }
                  error={Boolean(errors.configuration?.employeeLimit)}
                  helperText={
                    errors.configuration?.employeeLimit?.message ||
                    `Range for ${planDef.id}: ${planDef.min.toLocaleString()}–${planDef.max.toLocaleString()}`
                  }
                  fullWidth
                />
              </Box>
            </FormSection>

            <FormSection icon={<AppsIcon />} title="Modules" description="Business modules enabled for this tenant.">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 1.5,
                  '@media (min-width:768px)': { gridTemplateColumns: '1fr 1fr' },
                }}
              >
                {MODULE_DEFS.map((module) => {
                  const enabled = modules.includes(module.key);
                  return (
                    <Box
                      key={module.key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        p: 1.75,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: enabled ? 'primary.main' : 'divider',
                        bgcolor: enabled ? 'action.selected' : 'transparent',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {module.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {module.desc}
                        </Typography>
                      </Box>
                      <Switch
                        checked={enabled}
                        onChange={(event) => toggleModule(module.key, event.target.checked)}
                      />
                    </Box>
                  );
                })}
              </Box>
            </FormSection>

            <FormSection icon={<SettingsIcon />} title="Settings" description="Access controls for this tenant.">
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Tenant active
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Inactive tenants can't sign in until reactivated.
                  </Typography>
                </Box>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />
                  )}
                />
              </Stack>
            </FormSection>
          </Stack>

          <Box
            sx={{
              position: { xs: 'sticky', md: 'static' },
              bottom: 0,
              mt: 3,
              py: 2,
              bgcolor: 'background.default',
              borderTop: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              loading={isSubmitting}
              fullWidth
              sx={{ maxWidth: { md: 240 } }}
            >
              Save changes
            </Button>
          </Box>
        </Box>
      </FormProvider>
    </ThemeProvider>
  );
}
