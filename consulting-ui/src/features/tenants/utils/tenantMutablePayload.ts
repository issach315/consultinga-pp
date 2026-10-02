import type { Tenant, TenantMutableFields } from '../types/tenant.types';

/** Projects a full `Tenant` down to the mutable fields the update endpoint expects. */
export function tenantMutablePayload(tenant: Tenant): TenantMutableFields {
  return {
    companyDetails: {
      legalCompanyName: tenant.legalCompanyName,
      displayName: tenant.displayName ?? '',
      tenantCode: tenant.tenantCode,
      subdomain: tenant.subdomain,
      industry: tenant.industry ?? '',
      tenantType: tenant.tenantType,
      companyEmail: tenant.companyEmail ?? '',
      phone: tenant.phone ?? '',
      website: tenant.website ?? '',
    },
    location: {
      country: tenant.country ?? '',
      state: tenant.state ?? '',
      city: tenant.city ?? '',
      postalCode: tenant.postalCode ?? '',
      timezone: tenant.timezone ?? '',
      currency: tenant.currency ?? '',
      businessAddress: tenant.businessAddress ?? '',
    },
    modules: tenant.enabledModules,
    configuration: {
      plan: tenant.plan,
      employeeLimit: tenant.employeeLimit,
    },
    branding: {
      logoObjectKey: tenant.logoObjectKey ?? '',
      primaryBrandColor: tenant.primaryBrandColor ?? '#343a40',
      emailSenderName: tenant.emailSenderName ?? '',
      supportEmail: tenant.supportEmail ?? '',
    },
  };
}
