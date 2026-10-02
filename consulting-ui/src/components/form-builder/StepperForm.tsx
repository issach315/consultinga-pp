import { useState, type ReactNode } from 'react';
import { Alert, Box, Button, Card, Stack, Step, StepButton, Stepper, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { SectionRenderer } from './SectionRenderer';
import { get } from './engine/paths';
import type { FormSchema, StepSchema } from './schema.types';

interface StepperFormProps {
  schema: FormSchema;
  role?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSaveDraft?: () => void;
  /**
   * Custom content for a step whose `sections` is empty, replacing the
   * default section list + built-in ReviewSummary — e.g. a hand-designed
   * review pane that needs to render a non-primitive field value (like a
   * permission matrix) instead of the generic stringified dump.
   */
  renderStepExtra?: (values: Record<string, unknown>) => ReactNode;
}

const NON_VALUE_TYPES = new Set(['heading', 'paragraph', 'divider']);
const REVIEW_SKIP_TYPES = new Set(['heading', 'paragraph', 'divider', 'hidden', 'fileUpload']);

function collectStepFieldNames(step: StepSchema): string[] {
  return step.sections.flatMap((section) =>
    section.fields.filter((field) => !NON_VALUE_TYPES.has(field.type)).map((field) => field.name),
  );
}

function ReviewSummary({ steps, activeStep }: { steps: StepSchema[]; activeStep: number }) {
  const { watch } = useFormContext();
  const values = watch() as Record<string, unknown>;
  const priorSteps = steps.slice(0, activeStep);
  if (priorSteps.length === 0) return null;

  return (
    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Review
      </Typography>
      <Stack spacing={2}>
        {priorSteps.map((step) => (
          <Box key={step.id}>
            <Typography variant="body2" fontWeight={600}>
              {step.title}
            </Typography>
            <Stack spacing={0.25} sx={{ mt: 0.5 }}>
              {step.sections
                .flatMap((section) => section.fields)
                .filter((field) => !REVIEW_SKIP_TYPES.has(field.type))
                .map((field) => {
                  const value = get(values, field.name);
                  const display = Array.isArray(value)
                    ? value.join(', ') || '—'
                    : value != null && value !== ''
                      ? String(value)
                      : '—';
                  return (
                    <Typography key={field.name} variant="caption" color="text.secondary">
                      {field.label ?? field.name}: <strong>{display}</strong>
                    </Typography>
                  );
                })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function StepperForm({
  schema,
  role,
  submitLabel = 'Submit',
  isSubmitting,
  onSaveDraft,
  renderStepExtra,
}: StepperFormProps) {
  const steps = schema.steps ?? [];
  const { trigger, watch } = useFormContext();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [draftNotice, setDraftNotice] = useState(false);

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  const goToStep = async (index: number) => {
    if (index === activeStep || !currentStep) return;
    const canJump = index < activeStep || completedSteps.has(index) || index === activeStep + 1;
    if (!canJump) return;
    if (index > activeStep) {
      const valid = await trigger(collectStepFieldNames(currentStep));
      if (!valid) return;
      setCompletedSteps((prev) => new Set(prev).add(activeStep));
    }
    setActiveStep(index);
  };

  const handleNext = async () => {
    if (!currentStep) return;
    const valid = await trigger(collectStepFieldNames(currentStep));
    if (!valid) return;
    setCompletedSteps((prev) => new Set(prev).add(activeStep));
    setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleBack = () => setActiveStep((step) => Math.max(step - 1, 0));

  const handleSaveDraft = () => {
    onSaveDraft?.();
    setDraftNotice(true);
  };

  if (!currentStep) return null;

  return (
    <Stack spacing={3}>
      <Stepper nonLinear activeStep={activeStep} alternativeLabel sx={{ overflowX: 'auto' }}>
        {steps.map((step, index) => (
          <Step key={step.id} completed={completedSteps.has(index)}>
            <StepButton onClick={() => goToStep(index)}>{step.title}</StepButton>
          </Step>
        ))}
      </Stepper>

      <Card variant="outlined" sx={{ p: 3 }}>
        {currentStep.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentStep.description}
          </Typography>
        )}

        {currentStep.sections.length === 0 && renderStepExtra ? (
          renderStepExtra(watch())
        ) : (
          <>
            <Stack spacing={2.5}>
              {currentStep.sections.map((section) => (
                <SectionRenderer key={section.id} section={section} role={role} />
              ))}
            </Stack>

            {isLastStep && <ReviewSummary steps={steps} activeStep={activeStep} />}
          </>
        )}
      </Card>

      <Box
        sx={{
          position: { xs: 'sticky', md: 'static' },
          bottom: 0,
          py: 2,
          bgcolor: 'background.default',
          borderTop: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>
        <Stack direction="row" spacing={1.5}>
          {schema.persistKey && (
            <Button variant="text" onClick={handleSaveDraft}>
              Save draft
            </Button>
          )}
          {isLastStep ? (
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {submitLabel}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Stack>
      </Box>

      {draftNotice && (
        <Alert severity="success" onClose={() => setDraftNotice(false)}>
          Draft saved — you can resume this form later.
        </Alert>
      )}
    </Stack>
  );
}
