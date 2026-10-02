import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { Alert, Box, Button, LinearProgress, Paper, Snackbar, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { ApiError } from '@/types';
import { useCreateTenantMutation } from '../../api/tenantQueries';
import {
  STEP_FIELDS,
  TENANT_WIZARD_DEFAULT_VALUES,
  tenantWizardSchema,
  type TenantWizardFormValues,
} from '../../schemas/tenantWizardSchema';
import type { CreateTenantPayload, Tenant } from '../../types/tenant.types';
import { CompanyDetailsStep } from './CompanyDetailsStep';
import { LocationStep } from './LocationStep';
import { TenantAdminStep } from './TenantAdminStep';
import { ModulesStep } from './ModulesStep';
import { PlanConfigurationStep } from './PlanConfigurationStep';
import { BrandingStep } from './BrandingStep';
import { ReviewStep } from './ReviewStep';
import { WizardSidebar } from '@/components/wizard/WizardSidebar';
import { WIZARD_STEPS } from './wizardSteps';

const STEP_COMPONENTS = [
  CompanyDetailsStep,
  LocationStep,
  TenantAdminStep,
  ModulesStep,
  PlanConfigurationStep,
  BrandingStep,
  ReviewStep,
] as const;

// Keeps the step-transition indicator visible for at least this long, so
// fast (near-instant) transitions still read as a deliberate animation
// rather than a flicker.
const MIN_TRANSITION_MS = 220;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toCreatePayload(values: TenantWizardFormValues): CreateTenantPayload {
  return {
    companyDetails: values.companyDetails,
    location: values.location,
    tenantAdmin: {
      firstName: values.tenantAdmin.firstName,
      lastName: values.tenantAdmin.lastName,
      workEmail: values.tenantAdmin.workEmail,
      jobTitle: values.tenantAdmin.jobTitle,
      phone: values.tenantAdmin.phone,
    },
    modules: values.modules,
    configuration: values.configuration,
    branding: {
      logoObjectKey: values.branding.logoObjectKey,
      primaryBrandColor: values.branding.primaryBrandColor,
      emailSenderName: values.branding.emailSenderName,
      supportEmail: values.branding.supportEmail,
    },
  };
}

interface TenantOnboardingWizardProps {
  onCreated: (tenant: Tenant) => void;
}

export function TenantOnboardingWizard({ onCreated }: TenantOnboardingWizardProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState(false);
  const createTenant = useCreateTenantMutation();
  const formRef = useRef<HTMLFormElement>(null);

  const methods = useForm<TenantWizardFormValues>({
    resolver: zodResolver(tenantWizardSchema),
    defaultValues: TENANT_WIZARD_DEFAULT_VALUES,
    mode: 'onBlur',
  });
  const { trigger, handleSubmit } = methods;

  const navigateTo = async (step: () => void | Promise<void>) => {
    if (isNavigating) return;
    setIsNavigating(true);
    const startedAt = Date.now();
    await step();
    const remaining = MIN_TRANSITION_MS - (Date.now() - startedAt);
    if (remaining > 0) await sleep(remaining);
    setIsNavigating(false);
  };

  const handleNext = () =>
    navigateTo(async () => {
      const fields = STEP_FIELDS[activeStep] ?? [];
      const valid = fields.length === 0 || (await trigger(fields));
      if (valid) setActiveStep((step) => Math.min(step + 1, STEP_COMPONENTS.length));
    });

  const handleBack = () =>
    navigateTo(() => {
      setActiveStep((step) => Math.max(step - 1, 1));
    });

  const handleStepClick = (stepId: number) =>
    navigateTo(() => {
      setActiveStep(stepId);
    });

  const isLastStep = activeStep === STEP_COMPONENTS.length;

  // Top header button mirrors the bottom one — Next while mid-wizard, submits
  // the form (via the native form element, since this button lives outside it) on the last step.
  const handlePrimaryAction = () => {
    if (isLastStep) {
      formRef.current?.requestSubmit();
    } else {
      handleNext();
    }
  };

  const onSubmit = async (values: TenantWizardFormValues) => {
    setSubmitError(null);
    try {
      const tenant = await createTenant.mutateAsync(toCreatePayload(values));
      onCreated(tenant);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to create tenant.');
    }
  };

  const ActiveStepComponent = STEP_COMPONENTS[activeStep - 1] ?? STEP_COMPONENTS[0];

  return (
    <FormProvider {...methods}>
      <PageHeader
        title="New tenant"
        description="Set up a new consulting organization, administrator, modules, and tenant configuration."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Tenants', path: '/tenants' },
          { label: 'New' },
        ]}
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" disabled={isNavigating} onClick={() => navigate('/tenants')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              loading={isNavigating || createTenant.isPending}
              onClick={handlePrimaryAction}
            >
              {isLastStep ? 'Create tenant' : 'Next'}
            </Button>
          </Stack>
        }
      />

      <Box component="form" noValidate ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          <WizardSidebar
            steps={WIZARD_STEPS}
            activeStep={activeStep}
            onStepClick={handleStepClick}
            disabled={isNavigating}
          />

          <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Box sx={{ height: 3 }}>{isNavigating && <LinearProgress />}</Box>
            <Box
              key={activeStep}
              sx={{
                p: 3,
                '@keyframes stepFadeIn': {
                  from: { opacity: 0, transform: 'translateY(6px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                animation: 'stepFadeIn 0.25s ease',
              }}
            >
              <ActiveStepComponent />
            </Box>

            <Box
              sx={{
                px: 3,
                pb: 3,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Button disabled={activeStep === 1 || isNavigating} onClick={handleBack}>
                Back
              </Button>
              <Stack direction="row" spacing={1.5}>
                <Button variant="text" disabled={isNavigating} onClick={() => setDraftNotice(true)}>
                  Save draft
                </Button>
                {!isLastStep ? (
                  <Button variant="contained" loading={isNavigating} onClick={handleNext}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" variant="contained" loading={createTenant.isPending || isNavigating}>
                    Create tenant
                  </Button>
                )}
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </Box>

      <Snackbar
        open={draftNotice}
        autoHideDuration={3000}
        onClose={() => setDraftNotice(false)}
        message="Draft saving isn't available yet — please complete the wizard in one session."
      />
    </FormProvider>
  );
}
