import { useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Stack, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useFormContext } from 'react-hook-form';
import { useUploadTenantLogoMutation } from '../../api/tenantQueries';
import type { TenantEditFormValues } from '../../schemas/tenantEditSchema';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const MAX_BYTES = 2 * 1024 * 1024;

export function LogoPicker() {
  const { watch, setValue } = useFormContext<TenantEditFormValues>();
  const uploadLogo = useUploadTenantLogoMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoPreviewUrl = watch('branding.logoPreviewUrl');
  const companyName = watch('companyDetails.legalCompanyName');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!VALID_TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setError('File exceeds the 2MB limit or has an unsupported type (PNG, JPG, SVG only).');
      return;
    }

    try {
      const result = await uploadLogo.mutateAsync(file);
      setValue('branding.logoObjectKey', result.logoObjectKey, { shouldDirty: true });
      setValue('branding.logoPreviewUrl', result.previewUrl, { shouldDirty: true });
    } catch {
      setError('Upload failed. Please try again.');
    }
  };

  const handleRemove = () => {
    setValue('branding.logoObjectKey', '', { shouldDirty: true });
    setValue('branding.logoPreviewUrl', '', { shouldDirty: true });
  };

  return (
    <Stack spacing={1.5}>
      <Box
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2.5,
          border: '1px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          bgcolor: dragActive ? 'action.hover' : 'background.default',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <Avatar
          variant="rounded"
          src={logoPreviewUrl || undefined}
          sx={{ width: 108, height: 108, fontSize: 32, bgcolor: 'grey.200', color: 'text.secondary' }}
        >
          {!logoPreviewUrl && (companyName?.trim()?.[0]?.toUpperCase() ?? '?')}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {companyName?.trim() || 'Company logo'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25, display: 'block' }}>
            PNG, JPG or SVG · Max 2MB
          </Typography>
          <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloudUploadOutlinedIcon fontSize="small" />}
              onClick={() => fileInputRef.current?.click()}
              loading={uploadLogo.isPending}
            >
              {logoPreviewUrl ? 'Change logo' : 'Upload logo'}
            </Button>
            {logoPreviewUrl && (
              <Button size="small" color="error" onClick={handleRemove}>
                Remove logo
              </Button>
            )}
          </Stack>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          hidden
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
