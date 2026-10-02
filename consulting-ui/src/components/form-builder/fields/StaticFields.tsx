import { Divider, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { get } from '../engine/paths';
import type { StaticFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

const HEADING_VARIANT = { 1: 'h5', 2: 'h6', 3: 'subtitle1', 4: 'subtitle2' } as const;

export function HeadingField({ field }: FieldRendererProps<StaticFieldSchema>) {
  return (
    <Typography variant={HEADING_VARIANT[field.level ?? 2]} fontWeight={700}>
      {field.content ?? field.label}
    </Typography>
  );
}

export function ParagraphField({ field }: FieldRendererProps<StaticFieldSchema>) {
  return (
    <Typography variant="body2" color="text.secondary">
      {field.content ?? field.label}
    </Typography>
  );
}

export function DividerField() {
  return <Divider />;
}

/** Plain, non-editable value display — distinct from the `readonly` flag on other field types. */
export function ReadonlyField({ field }: FieldRendererProps<StaticFieldSchema>) {
  const { watch } = useFormContext();
  const value = get(watch(), field.name);
  return (
    <Typography variant="body2">
      <Typography component="span" color="text.secondary">
        {field.label}:{' '}
      </Typography>
      {value != null && value !== '' ? String(value) : '—'}
    </Typography>
  );
}

export function HiddenField({ field }: FieldRendererProps<StaticFieldSchema>) {
  const { control } = useFormContext();
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField }) => <input type="hidden" {...rhfField} value={rhfField.value ?? ''} />}
    />
  );
}
