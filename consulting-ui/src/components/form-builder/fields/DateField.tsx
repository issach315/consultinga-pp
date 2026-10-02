import { TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldState } from '../engine/useFieldState';
import type { DateFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

// Native date/time inputs — matches this app's existing convention (see
// EmployeeForm's "Hire date" field) rather than pulling in @mui/x-date-pickers.
const HTML_TYPE: Record<DateFieldSchema['type'], string> = {
  date: 'date',
  time: 'time',
  datetime: 'datetime-local',
};

export function DateField({ field }: FieldRendererProps<DateFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, readOnly, error } = useFieldState(field);

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField }) => (
        <TextField
          {...rhfField}
          value={rhfField.value ?? ''}
          type={HTML_TYPE[field.type]}
          label={field.label}
          fullWidth
          required={Boolean(field.validation?.required)}
          disabled={disabled}
          error={Boolean(error)}
          helperText={error?.message ?? field.description}
          title={field.tooltip}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: field.minDate, max: field.maxDate, readOnly },
          }}
        />
      )}
    />
  );
}
