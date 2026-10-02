import { useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Stack, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useFormContext } from 'react-hook-form';
import { useUploadEmployeePhotoMutation } from '../../api/employeeQueries';
import type { EmployeeOnboardWizardFormValues } from '../../schema/employeeOnboardWizardSchema';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_BYTES = 2 * 1024 * 1024;

interface ProfilePhotoPickerProps {
  tenantId: string;
}

/** Profile-photo drop zone for the onboarding wizard — adapted from the tenant LogoPicker pattern. */
export function ProfilePhotoPicker({ tenantId }: ProfilePhotoPickerProps) {
  const { watch, setValue } = useFormContext<EmployeeOnboardWizardFormValues>();
  const uploadPhoto = useUploadEmployeePhotoMutation(tenantId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoPreviewUrl = watch('profile.photoPreviewUrl');
  const firstName = watch('profile.firstName');
  const lastName = watch('profile.lastName');
  const initials = [firstName, lastName].filter(Boolean).map((part) => part[0]).join('').toUpperCase();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!VALID_TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setError('File exceeds the 2MB limit or has an unsupported type (PNG or JPG only).');
      return;
    }

    try {
      const result = await uploadPhoto.mutateAsync(file);
      setValue('profile.photoObjectKey', result.photoObjectKey, { shouldDirty: true });
      setValue('profile.photoPreviewUrl', result.previewUrl, { shouldDirty: true });
    } catch {
      setError('Upload failed. Please try again.');
    }
  };

  const handleRemove = () => {
    setValue('profile.photoObjectKey', '', { shouldDirty: true });
    setValue('profile.photoPreviewUrl', '', { shouldDirty: true });
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
          src={photoPreviewUrl || undefined}
          sx={{ width: 72, height: 72, fontSize: 24, bgcolor: 'grey.200', color: 'text.secondary' }}
        >
          {!photoPreviewUrl && (initials || '?')}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">Profile Photo</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25, display: 'block' }}>
            Optional · JPG or PNG · Max 2MB
          </Typography>
          <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloudUploadOutlinedIcon fontSize="small" />}
              onClick={() => fileInputRef.current?.click()}
              loading={uploadPhoto.isPending}
            >
              {photoPreviewUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            {photoPreviewUrl && (
              <Button size="small" color="error" onClick={handleRemove}>
                Remove
              </Button>
            )}
          </Stack>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
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
