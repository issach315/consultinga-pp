import { InputAdornment, TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldState } from '../engine/useFieldState';
import type { TextFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

const HTML_TYPE: Record<string, string> = {
  text: 'text',
  email: 'email',
  password: 'password',
  url: 'url',
  number: 'number',
  currency: 'number',
};

export function TextInputField({ field }: FieldRendererProps<TextFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, readOnly, error } = useFieldState(field);
  const isTextarea = field.type === 'textarea';

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField }) => (
        <TextField
          {...rhfField}
          value={rhfField.value ?? ''}
          label={field.label}
          placeholder={field.placeholder}
          type={isTextarea ? undefined : HTML_TYPE[field.type]}
          multiline={isTextarea}
          minRows={isTextarea ? (field.rows ?? 3) : undefined}
          fullWidth
          required={Boolean(field.validation?.required)}
          disabled={disabled}
          error={Boolean(error)}
          helperText={error?.message ?? field.description}
          title={field.tooltip}
          slotProps={{
            input: {
              readOnly,
              startAdornment: field.startAdornment ? (
                <InputAdornment position="start">{field.startAdornment}</InputAdornment>
              ) : undefined,
              endAdornment: field.endAdornment ? (
                <InputAdornment position="end">{field.endAdornment}</InputAdornment>
              ) : undefined,
            },
          }}
        />
      )}
    />
  );
}
