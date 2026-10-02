import { Grid, IconButton, InputAdornment, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import { Controller, useFormContext } from 'react-hook-form';
import { INDUSTRY_OPTIONS } from '../../constants/formOptions';
import { slugifySubdomain } from '../../constants/subdomain';
import { generateTenantCode } from '../../constants/tenantCode';
import { TENANT_TYPE_OPTIONS } from '../../constants/tenantType';
import type { TenantWizardFormValues } from '../../schemas/tenantWizardSchema';
import { LabeledField } from '@/components/wizard/LabeledField';
import { PhoneNumberField } from '@/components/phone-number-field';

const BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || 'localhost';

export function CompanyDetailsStep() {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<TenantWizardFormValues>();

  const suggestSubdomain = () => {
    if (getValues('companyDetails.subdomain')) return;
    const suggested = slugifySubdomain(getValues('companyDetails.tenantCode'));
    if (suggested) setValue('companyDetails.subdomain', suggested, { shouldValidate: true });
  };

  // Tenant code is auto-generated from the company name — the user can still
  // edit it, or use the regenerate button, e.g. if it collides with an existing one.
  const suggestTenantCode = () => {
    if (getValues('companyDetails.tenantCode')) return;
    const companyName = getValues('companyDetails.legalCompanyName');
    if (!companyName) return;
    setValue('companyDetails.tenantCode', generateTenantCode(companyName), { shouldValidate: true });
    suggestSubdomain();
  };

  const regenerateTenantCode = () => {
    const companyName = getValues('companyDetails.legalCompanyName') || 'tenant';
    setValue('companyDetails.tenantCode', generateTenantCode(companyName), { shouldValidate: true });
  };

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Company Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tell us about the organization that will use the platform.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={12}>
          <LabeledField label="Legal company name" required>
            <TextField
              fullWidth
              placeholder="Acme Consulting Pvt. Ltd."
              error={Boolean(errors.companyDetails?.legalCompanyName)}
              helperText={errors.companyDetails?.legalCompanyName?.message}
              {...register('companyDetails.legalCompanyName', { onBlur: suggestTenantCode })}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Display name">
            <TextField fullWidth placeholder="Acme Consulting" {...register('companyDetails.displayName')} />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Tenant code" required>
            <TextField
              fullWidth
              placeholder="Auto-generated from company name"
              error={Boolean(errors.companyDetails?.tenantCode)}
              helperText={errors.companyDetails?.tenantCode?.message ?? 'Auto-generated — you can edit it'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Generate a new code">
                        <IconButton size="small" onClick={regenerateTenantCode} edge="end">
                          <AutorenewOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
              {...register('companyDetails.tenantCode', { onBlur: suggestSubdomain })}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Subdomain" required>
            <TextField
              fullWidth
              placeholder="acme"
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
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Industry">
            <Controller
              name="companyDetails.industry"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth>
                  <MenuItem value="">Select industry</MenuItem>
                  {INDUSTRY_OPTIONS.map((option) => (
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
          <LabeledField label="Tenant type" required>
            <Controller
              name="companyDetails.tenantType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
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
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Company email">
            <TextField
              type="email"
              fullWidth
              placeholder="hello@acme.com"
              error={Boolean(errors.companyDetails?.companyEmail)}
              helperText={errors.companyDetails?.companyEmail?.message}
              {...register('companyDetails.companyEmail')}
            />
          </LabeledField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <PhoneNumberField name="companyDetails.phone" control={control} label="Phone" defaultCountry="IN" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LabeledField label="Website">
            <TextField
              fullWidth
              placeholder="https://acme.com"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              {...register('companyDetails.website')}
            />
          </LabeledField>
        </Grid>
      </Grid>
    </>
  );
}
