import { MenuItem, TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldState } from '../engine/useFieldState';
import type { OptionsFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

/** Handles both `select` (single) and `multiselect` via schema.type. */
export function SelectField({ field }: FieldRendererProps<OptionsFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, readOnly, error } = useFieldState(field);
  const multiple = field.type === 'multiselect';

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField }) => (
        <TextField
          {...rhfField}
          value={rhfField.value ?? (multiple ? [] : '')}
          select
          slotProps={{ select: { multiple } }}
          label={field.label}
          placeholder={field.placeholder}
          fullWidth
          required={Boolean(field.validation?.required)}
          disabled={disabled}
          error={Boolean(error)}
          helperText={error?.message ?? field.description}
          title={field.tooltip}
        >
          {!multiple && <MenuItem value="">Select…</MenuItem>}
          {field.options.map((option) => (
            <MenuItem key={option.value} value={option.value} disabled={option.disabled || readOnly}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
