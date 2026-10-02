import { useRef, useState } from 'react';
import { Alert, Box, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useUploadTenantLogoMutation } from '../../api/tenantQueries';
import type { TenantWizardFormValues } from '../../schemas/tenantWizardSchema';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const MAX_BYTES = 2 * 1024 * 1024;

export function BrandingStep() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TenantWizardFormValues>();
  const uploadLogo = useUploadTenantLogoMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const logoPreviewUrl = watch('branding.logoPreviewUrl');

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setLogoError(null);

    if (!VALID_TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setLogoError('File exceeds 2MB limit or has an unsupported type.');
      return;
    }

    try {
      const result = await uploadLogo.mutateAsync(file);
      setValue('branding.logoObjectKey', result.logoObjectKey, { shouldDirty: true });
      setValue('branding.logoPreviewUrl', result.previewUrl, { shouldDirty: true });
    } catch {
      setLogoError('Upload failed. Please try again.');
    }
  };

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Branding
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize the tenant's identity inside the application.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Company logo
          </Typography>
          <Paper
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              borderStyle: 'dashed',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="body2">
              {uploadLogo.isPending ? 'Uploading…' : 'Click to upload a logo'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PNG, JPG or SVG · Max size 2MB
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              hidden
              onChange={(event) => handleFileSelect(event.target.files?.[0])}
            />
          </Paper>
          {logoError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {logoError}
            </Alert>
          )}
          {logoPreviewUrl && (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
              <Box
                component="img"
                src={logoPreviewUrl}
                alt="Logo preview"
                sx={{ width: 44, height: 44, objectFit: 'contain', border: 1, borderColor: 'divider', borderRadius: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Logo uploaded
              </Typography>
            </Stack>
          )}
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Primary brand color
          </Typography>
          <Controller
            name="branding.primaryBrandColor"
            control={control}
            render={({ field }) => (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <input
                  type="color"
                  value={field.value || '#343a40'}
                  onChange={field.onChange}
                  style={{ width: 52, height: 38, padding: 2, border: '1px solid #ccc', borderRadius: 6 }}
                />
                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                  {field.value || '#343a40'}
                </Typography>
              </Stack>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Email sender name"
            fullWidth
            placeholder="Acme Consulting Team"
            {...register('branding.emailSenderName')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Support email"
            type="email"
            fullWidth
            placeholder="support@acme.com"
            error={Boolean(errors.branding?.supportEmail)}
            helperText={errors.branding?.supportEmail?.message}
            {...register('branding.supportEmail')}
          />
        </Grid>
      </Grid>
    </>
  );
}
