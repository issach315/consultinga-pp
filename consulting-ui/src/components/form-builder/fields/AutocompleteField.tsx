import { Autocomplete, TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldState } from '../engine/useFieldState';
import type { OptionsFieldSchema, SelectOption } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

/** Handles both `autocomplete` (single) and `multiAutocomplete` via schema.type, static options. */
export function AutocompleteField({ field }: FieldRendererProps<OptionsFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, error } = useFieldState(field);
  const multiple = field.type === 'multiAutocomplete';

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField }) => {
        const selected: SelectOption[] | SelectOption | null = multiple
          ? field.options.filter((option) => (rhfField.value ?? []).includes(option.value))
          : (field.options.find((option) => option.value === rhfField.value) ?? null);

        return (
          <Autocomplete
            multiple={multiple}
            options={field.options}
            value={selected}
            disabled={disabled}
            freeSolo={field.freeSolo}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
            isOptionEqualToValue={(option, value) =>
              typeof value === 'string' ? option.label === value : option.value === value.value
            }
            onChange={(_event, next) => {
              if (multiple) {
                const values = (next as (SelectOption | string)[]).map((item) =>
                  typeof item === 'string' ? item : item.value,
                );
                rhfField.onChange(values);
              } else {
                const item = next as SelectOption | string | null;
                rhfField.onChange(item == null ? null : typeof item === 'string' ? item : item.value);
              }
            }}
            onBlur={rhfField.onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                placeholder={field.placeholder}
                required={Boolean(field.validation?.required)}
                error={Boolean(error)}
                helperText={error?.message ?? field.description}
                title={field.tooltip}
              />
            )}
          />
        );
      }}
    />
  );
}
