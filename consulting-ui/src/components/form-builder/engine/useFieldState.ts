import { useFormContext } from 'react-hook-form';
import type { FieldSchema } from '../schema.types';
import { evaluateCondition } from './conditions';
import { get } from './paths';

export interface FieldError {
  message?: string;
}

/** Shared disabled/readonly/error resolution used by every field renderer. */
export function useFieldState(field: FieldSchema) {
  const {
    formState: { errors },
    watch,
  } = useFormContext();

  const hasDynamicDisable = Boolean(field.disableWhen);
  const values = hasDynamicDisable ? watch() : undefined;
  const disabled =
    Boolean(field.disabled) ||
    (hasDynamicDisable ? evaluateCondition(field.disableWhen, (values ?? {}) as Record<string, unknown>) : false);

  const error = get(errors, field.name) as FieldError | undefined;

  return { disabled, readOnly: Boolean(field.readonly), error };
}
