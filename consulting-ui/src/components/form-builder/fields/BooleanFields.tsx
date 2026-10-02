import { Checkbox, FormControlLabel, FormHelperText, Switch, Tooltip } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldState } from '../engine/useFieldState';
import type { BooleanFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

function labelContent(field: BooleanFieldSchema) {
  if (!field.tooltip) return field.label;
  return (
    <Tooltip title={field.tooltip}>
      <span>{field.label}</span>
    </Tooltip>
  );
}

function helper(field: BooleanFieldSchema, error?: { message?: string }) {
  if (!error?.message && !field.description) return null;
  return <FormHelperText error={Boolean(error)}>{error?.message ?? field.description}</FormHelperText>;
}

export function CheckboxField({ field }: FieldRendererProps<BooleanFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, error } = useFieldState(field);

  return (
    <>
      <FormControlLabel
        label={labelContent(field)}
        control={
          <Controller
            name={field.name}
            control={control}
            render={({ field: rhfField }) => (
              <Checkbox
                checked={Boolean(rhfField.value)}
                onChange={(event) => rhfField.onChange(event.target.checked)}
                disabled={disabled}
              />
            )}
          />
        }
      />
      {helper(field, error)}
    </>
  );
}

export function SwitchField({ field }: FieldRendererProps<BooleanFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, error } = useFieldState(field);

  return (
    <>
      <FormControlLabel
        label={labelContent(field)}
        control={
          <Controller
            name={field.name}
            control={control}
            render={({ field: rhfField }) => (
              <Switch
                checked={Boolean(rhfField.value)}
                onChange={(event) => rhfField.onChange(event.target.checked)}
                disabled={disabled}
              />
            )}
          />
        }
      />
      {helper(field, error)}
    </>
  );
}
