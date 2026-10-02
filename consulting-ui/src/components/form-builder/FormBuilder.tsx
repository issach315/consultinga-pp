import { useMemo, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type FieldValues } from 'react-hook-form';
import { Alert, Box } from '@mui/material';
import { ApiError } from '@/types';
import { buildZodSchema } from './engine/buildZodSchema';
import { clearDraft, loadDraft, saveDraftNow, useAutosave } from './engine/useAutosave';
import { SingleForm } from './SingleForm';
import { StepperForm } from './StepperForm';
import type { FormSchema } from './schema.types';

export interface FormBuilderProps<TValues extends FieldValues = FieldValues> {
  schema: FormSchema;
  mode: 'single' | 'stepper';
  initialValues?: Partial<TValues>;
  onSubmit: (values: TValues) => Promise<void> | void;
  /** Current user's role, consulted by field/section `permissions`. */
  role?: string;
  submitLabel?: string;
  /** Stepper mode only — see StepperForm's `renderStepExtra`. */
  renderStepExtra?: (values: Record<string, unknown>) => ReactNode;
}

/**
 * Renders a complete form — layout, validation, conditional logic, and
 * submission — entirely from `schema`. Adding a new form is adding a new
 * FormSchema value; this component never needs to change for it.
 */
export function FormBuilder<TValues extends FieldValues = FieldValues>({
  schema,
  mode,
  initialValues,
  onSubmit,
  role,
  submitLabel,
  renderStepExtra,
}: FormBuilderProps<TValues>) {
  const resolver = useMemo(() => zodResolver(buildZodSchema(schema)), [schema]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // A saved draft (if any) wins over initialValues — resuming a draft is a
  // signal the user wants to pick up where they left off.
  const draft = useMemo(() => loadDraft<Partial<TValues>>(schema.persistKey), [schema.persistKey]);

  const methods = useForm<TValues>({
    resolver,
    defaultValues: { ...initialValues, ...draft } as never,
    mode: 'onBlur',
  });

  useAutosave(methods, schema.persistKey);

  const handleSubmit = async (values: TValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
      clearDraft(schema.persistKey);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const handleSaveDraft = () => saveDraftNow(schema.persistKey, methods.getValues());

  return (
    <FormProvider {...methods}>
      <Box component="form" noValidate onSubmit={methods.handleSubmit(handleSubmit)}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {submitError}
          </Alert>
        )}

        {mode === 'single' ? (
          <SingleForm
            schema={schema}
            role={role}
            submitLabel={submitLabel}
            isSubmitting={methods.formState.isSubmitting}
          />
        ) : (
          <StepperForm
            schema={schema}
            role={role}
            submitLabel={submitLabel}
            isSubmitting={methods.formState.isSubmitting}
            onSaveDraft={handleSaveDraft}
            renderStepExtra={renderStepExtra}
          />
        )}
      </Box>
    </FormProvider>
  );
}
