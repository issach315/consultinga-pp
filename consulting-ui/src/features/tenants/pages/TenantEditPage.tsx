import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { LoadingState, ErrorState } from '@/components/common';
import { useTenantDetailQuery, useUpdateTenantMutation } from '../api/tenantQueries';
import { TenantEditForm } from '../components/edit/TenantEditForm';
import { tenantMutablePayload } from '../utils/tenantMutablePayload';
import type { TenantEditFormValues } from '../schemas/tenantEditSchema';
import type { Tenant, UpdateTenantPayload } from '../types/tenant.types';

function toEditFormValues(tenant: Tenant): TenantEditFormValues {
  const mutable = tenantMutablePayload(tenant);
  return {
    ...mutable,
    branding: {
      ...mutable.branding,
      logoPreviewUrl: tenant.logoUrl ?? '',
    },
    isActive: tenant.isActive,
  };
}

function toUpdatePayload(values: TenantEditFormValues): UpdateTenantPayload {
  return {
    companyDetails: values.companyDetails,
    location: values.location,
    modules: values.modules,
    configuration: values.configuration,
    branding: {
      logoObjectKey: values.branding.logoObjectKey,
      primaryBrandColor: values.branding.primaryBrandColor,
      emailSenderName: values.branding.emailSenderName,
      supportEmail: values.branding.supportEmail,
    },
    isActive: values.isActive,
  };
}

export function TenantEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tenantQuery = useTenantDetailQuery(id);
  const updateTenant = useUpdateTenantMutation(id ?? '');

  const handleSubmit = async (values: TenantEditFormValues) => {
    await updateTenant.mutateAsync(toUpdatePayload(values));
    navigate('/tenants', {
      replace: true,
      state: { successMessage: 'Tenant updated successfully.' },
    });
  };

  return (
    <>
      <PageHeader
        title="Edit tenant"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Tenants', path: '/tenants' },
          { label: tenantQuery.data?.legalCompanyName ?? 'Edit' },
        ]}
      />

      {tenantQuery.isLoading && <LoadingState variant="card" />}

      {tenantQuery.isError && (
        <ErrorState message={tenantQuery.error.message} onRetry={() => tenantQuery.refetch()} />
      )}

      {tenantQuery.data && (
        <TenantEditForm defaultValues={toEditFormValues(tenantQuery.data)} onSubmit={handleSubmit} />
      )}
    </>
  );
}

export default TenantEditPage;
