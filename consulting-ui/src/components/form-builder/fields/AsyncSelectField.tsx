import { useEffect, useRef, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { useDebouncedValue } from '../engine/useDebouncedValue';
import { useFieldState } from '../engine/useFieldState';
import type { AsyncSelectFieldSchema, SelectOption } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

interface RemoteRecord {
  [key: string]: unknown;
}

/** Remote-backed select — search-as-you-type, and optionally reloads when a parent field changes. */
export function AsyncSelectField({ field }: FieldRendererProps<AsyncSelectFieldSchema>) {
  const { control, watch, setValue } = useFormContext();
  const { disabled: baseDisabled, error } = useFieldState(field);
  const { async: cfg, multiple } = field;
  const searchParam = cfg.searchParam ?? 'search';
  const valueKey = cfg.valueKey ?? 'value';
  const labelKey = cfg.labelKey ?? 'label';
  const minSearchLength = cfg.minSearchLength ?? 0;
  const debounceMs = cfg.debounceMs ?? 300;

  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebouncedValue(inputValue, debounceMs);
  const dependsOnValue = cfg.dependsOn ? watch(cfg.dependsOn) : undefined;

  // Reset this field whenever its parent changes — but not on first mount,
  // so a pre-filled default value (e.g. editing an existing record) survives.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (cfg.dependsOn) {
      setValue(field.name, multiple ? [] : null, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependsOnValue]);

  const dependencyMissing = Boolean(cfg.dependsOn) && !dependsOnValue;
  const searchTooShort = debouncedSearch.length < minSearchLength;

  const query = useQuery({
    queryKey: ['form-builder', 'async-select', cfg.url, debouncedSearch, dependsOnValue],
    queryFn: async () => {
      const params: Record<string, unknown> = { [searchParam]: debouncedSearch };
      if (cfg.dependsOn) params[cfg.dependsOnParam ?? cfg.dependsOn] = dependsOnValue;
      const { data } = await apiClient.get<RemoteRecord[]>(cfg.url, { params });
      return data.map(
        (item): SelectOption => ({ value: item[valueKey] as string | number, label: String(item[labelKey]) }),
      );
    },
    enabled: !dependencyMissing && !searchTooShort,
    staleTime: 30_000,
  });

  const options = query.data ?? [];
  const disabled = baseDisabled || dependencyMissing;

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField }) => {
        const selected = multiple
          ? options.filter((option) => (rhfField.value ?? []).includes(option.value))
          : (options.find((option) => option.value === rhfField.value) ?? null);

        return (
          <Autocomplete
            multiple={multiple}
            options={options}
            value={selected}
            disabled={disabled}
            loading={query.isFetching}
            filterOptions={(x) => x}
            inputValue={inputValue}
            onInputChange={(_event, next) => setInputValue(next)}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            onChange={(_event, next) => {
              if (multiple) {
                rhfField.onChange((next as SelectOption[]).map((option) => option.value));
              } else {
                rhfField.onChange((next as SelectOption | null)?.value ?? null);
              }
            }}
            onBlur={rhfField.onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                placeholder={dependencyMissing ? `Select ${cfg.dependsOn} first` : field.placeholder}
                required={Boolean(field.validation?.required)}
                error={Boolean(error)}
                helperText={error?.message ?? field.description}
                title={field.tooltip}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {query.isFetching && <CircularProgress color="inherit" size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        );
      }}
    />
  );
}
