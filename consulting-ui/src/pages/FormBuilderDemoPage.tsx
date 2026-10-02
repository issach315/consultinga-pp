import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Snackbar, Tab, Tabs } from '@mui/material';
import { PageHeader } from '@/components/layout';
import { FormBuilder } from '@/components/form-builder';
import { useCreateTenantMutation } from '@/features/tenants/api/tenantQueries';
import { buildTenantLoginUrl } from '@/utils/tenantSubdomain';
import type { CreateTenantPayload } from '@/features/tenants/types/tenant.types';
import type { TenantPlanId } from '@/features/tenants/constants/plans';
import {
  tenantRegistrationSchema,
  type TenantRegistrationFormValues,
} from '@/components/form-builder/examples/tenantRegistrationSchema';
import {
  quickContactSchema,
  type QuickContactFormValues,
} from '@/components/form-builder/examples/quickContactSchema';

function toCreateTenantPayload(values: TenantRegistrationFormValues): CreateTenantPayload {
  return {
    companyDetails: {
      legalCompanyName: values.companyDetails.legalCompanyName,
      displayName: values.companyDetails.displayName || undefined,
      tenantCode: values.companyDetails.tenantCode,
      subdomain: values.companyDetails.subdomain,
      industry: values.companyDetails.industry || undefined,
      tenantType: values.companyDetails.tenantType as CreateTenantPayload['companyDetails']['tenantType'],
      companyEmail: values.companyDetails.companyEmail || undefined,
      phone: values.companyDetails.phone || undefined,
      website: values.companyDetails.website || undefined,
    },
    location: { ...values.location },
    tenantAdmin: { ...values.tenantAdmin },
    modules: values.modules ?? [],
    configuration: {
      plan: values.configuration.plan as TenantPlanId,
      employeeLimit: Number(values.configuration.employeeLimit),
    },
    branding: {
      primaryBrandColor: values.branding?.primaryBrandColor || undefined,
      emailSenderName: values.branding?.emailSenderName || undefined,
      supportEmail: values.branding?.supportEmail || undefined,
    },
  };
}

function TenantRegistrationDemo() {
  const navigate = useNavigate();
  const createTenant = useCreateTenantMutation();

  const handleSubmit = async (values: TenantRegistrationFormValues) => {
    const tenant = await createTenant.mutateAsync(toCreateTenantPayload(values));
    const loginUrl = buildTenantLoginUrl(tenant.subdomain);
    navigate('/tenants', {
      state: {
        successMessage: `Tenant "${tenant.legalCompanyName}" created via the schema-driven form builder. They can sign in at ${loginUrl}.`,
      },
    });
  };

  return (
    <FormBuilder<TenantRegistrationFormValues>
      schema={tenantRegistrationSchema}
      mode="stepper"
      submitLabel="Create tenant"
      onSubmit={handleSubmit}
      initialValues={{
        companyDetails: { legalCompanyName: '', tenantCode: '', subdomain: '', tenantType: 'Domestic' },
        modules: [],
        configuration: { plan: 'Starter', employeeLimit: 25 },
      }}
    />
  );
}

function QuickContactDemo() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (values: QuickContactFormValues) => {
    // Schema-only demo — no backend for this one, so just prove the data made it through.
    console.info('[form-builder demo] quick contact submission', values);
    setSubmitted(true);
  };

  return (
    <>
      <FormBuilder<QuickContactFormValues>
        schema={quickContactSchema}
        mode="single"
        submitLabel="Submit request"
        onSubmit={handleSubmit}
        initialValues={{ additionalContacts: [] }}
      />
      <Snackbar open={submitted} autoHideDuration={5000} onClose={() => setSubmitted(false)}>
        <Alert severity="success" onClose={() => setSubmitted(false)} sx={{ maxWidth: 480 }}>
          Submitted — no backend wired up for this demo, so the values were logged to the console instead.
        </Alert>
      </Snackbar>
    </>
  );
}

export function FormBuilderDemoPage() {
  const [tab, setTab] = useState<'tenant' | 'contact'>('tenant');

  return (
    <>
      <PageHeader
        title="Form Builder"
        description="One schema-driven <FormBuilder/> powering two very different forms — a live, multi-step tenant registration wired to the real API, and a single-page schema-only demo."
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Form Builder' }]}
      />

      <Tabs value={tab} onChange={(_event, next) => setTab(next)} sx={{ mb: 3 }}>
        <Tab value="tenant" label="Tenant registration (live)" />
        <Tab value="contact" label="Support request (schema-only)" />
      </Tabs>

      <Box sx={{ maxWidth: 900 }}>{tab === 'tenant' ? <TenantRegistrationDemo /> : <QuickContactDemo />}</Box>
    </>
  );
}

export default FormBuilderDemoPage;
