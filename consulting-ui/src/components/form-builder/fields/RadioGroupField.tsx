import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldState } from '../engine/useFieldState';
import type { OptionsFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

export function RadioGroupField({ field }: FieldRendererProps<OptionsFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, error } = useFieldState(field);

  return (
    <FormControl error={Boolean(error)} disabled={disabled} required={Boolean(field.validation?.required)}>
      {field.label && <FormLabel>{field.label}</FormLabel>}
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhfField }) => (
          <RadioGroup {...rhfField} value={rhfField.value ?? ''}>
            {field.options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        )}
      />
      <FormHelperText>{error?.message ?? field.description}</FormHelperText>
    </FormControl>
  );
}
