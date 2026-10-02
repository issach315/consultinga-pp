import type { TenantPlanId } from '../constants/plans';
import type { TenantTypeId } from '../constants/tenantType';

export interface TenantListItem {
  id: string;
  legalCompanyName: string;
  tenantCode: string;
  subdomain: string;
  plan: TenantPlanId;
  employeeLimit: number;
  adminEmail: string;
  isActive: boolean;
  createdAt: string;
}

export interface Tenant extends TenantListItem {
  displayName: string | null;
  industry: string | null;
  tenantType: TenantTypeId;
  companyEmail: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  timezone: string | null;
  currency: string | null;
  businessAddress: string | null;
  enabledModules: string[];
  employeeIdPrefix: string;
  logoUrl: string | null;
  logoObjectKey: string | null;
  primaryBrandColor: string | null;
  emailSenderName: string | null;
  supportEmail: string | null;
  adminFirstName: string;
  adminLastName: string;
  updatedAt: string;
  /** null when no invite email was attempted in this request; true/false is the actual send outcome. */
  inviteEmailSent: boolean | null;
}

export interface TenantListParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  plan?: TenantPlanId;
  tenantType?: TenantTypeId;
}

export interface TenantMutableFields {
  companyDetails: {
    legalCompanyName: string;
    displayName?: string;
    tenantCode: string;
    subdomain: string;
    industry?: string;
    tenantType: TenantTypeId;
    companyEmail?: string;
    phone?: string;
    website?: string;
  };
  location: {
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    timezone?: string;
    currency?: string;
    businessAddress?: string;
  };
  modules: string[];
  configuration: {
    plan: TenantPlanId;
    employeeLimit: number;
  };
  branding: {
    logoObjectKey?: string;
    primaryBrandColor?: string;
    emailSenderName?: string;
    supportEmail?: string;
  };
}

export interface CreateTenantPayload extends TenantMutableFields {
  tenantAdmin: {
    firstName: string;
    lastName: string;
    workEmail: string;
    jobTitle?: string;
    phone?: string;
  };
}

export interface UpdateTenantPayload extends TenantMutableFields {
  isActive: boolean;
}

export interface LogoUploadResult {
  logoObjectKey: string;
  previewUrl: string;
}
