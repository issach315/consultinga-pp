import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { PhoneNumberField } from '@/components/phone-number-field';
import { ApiError } from '@/types';
import { clientSchema, type ClientFormValues } from '../schemas/clientSchema';
import { COMPANY_TYPE_OPTIONS, type Client } from '../types/client.types';

interface ClientFormDialogProps {
  open: boolean;
  client?: Client | null;
  loading?: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
}

const emptyValues: ClientFormValues = {
  companyName: '',
  companyType: 'PRIVATE_LIMITED',
  industry: '',
  contactPersonName: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
  designation: '',
  website: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  status: 'ACTIVE',
  notes: '',
};

function valuesForClient(client: Client | null | undefined): ClientFormValues {
  if (!client) return emptyValues;
  return {
    companyName: client.companyName,
    companyType: client.companyType,
    industry: client.industry ?? '',
    contactPersonName: client.contactPersonName,
    contactPersonEmail: client.contactPersonEmail,
    contactPersonPhone: client.contactPersonPhone ?? '',
    designation: client.designation ?? '',
    website: client.website ?? '',
    address: client.address ?? '',
    city: client.city ?? '',
    state: client.state ?? '',
    country: client.country ?? '',
    postalCode: client.postalCode ?? '',
    status: client.status,
    notes: client.notes ?? '',
  };
}

export function ClientFormDialog({
  open,
  client,
  loading,
  error,
  onClose,
  onSubmit,
}: ClientFormDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (open) reset(valuesForClient(client));
  }, [client, open, reset]);

  const field = (name: keyof ClientFormValues) => ({
    ...register(name),
    error: Boolean(errors[name]),
    helperText: errors[name]?.message,
  });

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{client ? 'Edit client' : 'Onboard client'}</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error instanceof ApiError ? error.message : 'Unable to save the client.'}
            </Alert>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Company information
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            <TextField label="Company name" required {...field('companyName')} />
            <Controller
              name="companyType"
              control={control}
              render={({ field: controllerField }) => (
                <TextField {...controllerField} select label="Company type" required>
                  {COMPANY_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField label="Industry" {...field('industry')} />
            <TextField label="Website" placeholder="https://example.com" {...field('website')} />
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5 }}>
            Primary contact
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            <TextField label="Contact person" required {...field('contactPersonName')} />
            <TextField label="Designation" {...field('designation')} />
            <TextField
              label="Email"
              type="email"
              required
              {...field('contactPersonEmail')}
            />
            <PhoneNumberField
              name="contactPersonPhone"
              control={control}
              label="Phone number"
              variant="compact"
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5 }}>
            Address and status
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            <TextField
              label="Address"
              multiline
              minRows={2}
              sx={{ gridColumn: { sm: '1 / -1' } }}
              {...field('address')}
            />
            <TextField label="City" {...field('city')} />
            <TextField label="State" {...field('state')} />
            <TextField label="Country" {...field('country')} />
            <TextField label="Postal code" {...field('postalCode')} />
            <Controller
              name="status"
              control={control}
              render={({ field: controllerField }) => (
                <TextField {...controllerField} select label="Status">
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>
              )}
            />
            <TextField
              label="Notes"
              multiline
              minRows={3}
              sx={{ gridColumn: { sm: '1 / -1' } }}
              {...field('notes')}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={loading}>
            {client ? 'Save changes' : 'Onboard client'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
