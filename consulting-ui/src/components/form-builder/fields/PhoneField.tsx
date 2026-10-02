import { useFormContext } from 'react-hook-form';
import { PhoneNumberField } from '@/components/phone-number-field';
import { useFieldState } from '../engine/useFieldState';
import type { PhoneFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

/** Adapts the shared global PhoneNumberField into the form-builder's field-renderer contract. */
export function PhoneField({ field }: FieldRendererProps<PhoneFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, readOnly } = useFieldState(field);

  return (
    <PhoneNumberField
      name={field.name}
      control={control}
      label={field.label}
      required={Boolean(field.validation?.required)}
      disabled={disabled}
      readOnly={readOnly}
      defaultCountry={field.defaultCountry}
      placeholder={field.placeholder}
      helperText={field.description}
    />
  );
}
