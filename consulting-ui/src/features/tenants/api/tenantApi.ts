import { apiClient } from '@/services/api/client';
import { tenantEndpoints } from '@/services/api/endpoints';
import type { PaginatedResponse, PaginationMeta } from '@/types';
import type { TenantPlanId } from '../constants/plans';
import type { TenantTypeId } from '../constants/tenantType';
import type {
  CreateTenantPayload,
  LogoUploadResult,
  Tenant,
  TenantListItem,
  TenantListParams,
  TenantMutableFields,
  UpdateTenantPayload,
} from '../types/tenant.types';

interface TenantListItemDto {
  id: string;
  legal_company_name: string;
  tenant_code: string;
  subdomain: string;
  plan: string;
  employee_limit: number;
  admin_email: string;
  is_active: boolean;
  created_at: string;
}

interface TenantDto extends TenantListItemDto {
  display_name: string | null;
  industry: string | null;
  tenant_type: TenantTypeId;
  company_email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  timezone: string | null;
  currency: string | null;
  business_address: string | null;
  enabled_modules: string[];
  employee_id_prefix: string;
  logo_url: string | null;
  logo_object_key: string | null;
  primary_brand_color: string | null;
  email_sender_name: string | null;
  support_email: string | null;
  admin_first_name: string;
  admin_last_name: string;
  updated_at: string;
  invite_email_sent: boolean | null;
}

interface PaginationMetaDto {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

interface PaginatedDto<T> {
  items: T[];
  meta: PaginationMetaDto;
}

interface LogoUploadDto {
  logo_object_key: string;
  preview_url: string;
}

function toMeta(dto: PaginationMetaDto): PaginationMeta {
  return {
    page: dto.page,
    pageSize: dto.page_size,
    totalItems: dto.total_items,
    totalPages: dto.total_pages,
  };
}

function toTenantListItem(dto: TenantListItemDto): TenantListItem {
  return {
    id: dto.id,
    legalCompanyName: dto.legal_company_name,
    tenantCode: dto.tenant_code,
    subdomain: dto.subdomain,
    plan: dto.plan as TenantPlanId,
    employeeLimit: dto.employee_limit,
    adminEmail: dto.admin_email,
    isActive: dto.is_active,
    createdAt: dto.created_at,
  };
}

function toTenant(dto: TenantDto): Tenant {
  return {
    ...toTenantListItem(dto),
    displayName: dto.display_name,
    industry: dto.industry,
    tenantType: dto.tenant_type,
    companyEmail: dto.company_email,
    phone: dto.phone,
    website: dto.website,
    country: dto.country,
    state: dto.state,
    city: dto.city,
    postalCode: dto.postal_code,
    timezone: dto.timezone,
    currency: dto.currency,
    businessAddress: dto.business_address,
    enabledModules: dto.enabled_modules,
    employeeIdPrefix: dto.employee_id_prefix,
    logoUrl: dto.logo_url,
    logoObjectKey: dto.logo_object_key,
    primaryBrandColor: dto.primary_brand_color,
    emailSenderName: dto.email_sender_name,
    supportEmail: dto.support_email,
    adminFirstName: dto.admin_first_name,
    adminLastName: dto.admin_last_name,
    updatedAt: dto.updated_at,
    inviteEmailSent: dto.invite_email_sent,
  };
}

function toMutableFieldsDto(payload: TenantMutableFields) {
  return {
    company_details: {
      legal_company_name: payload.companyDetails.legalCompanyName,
      display_name: payload.companyDetails.displayName || undefined,
      tenant_code: payload.companyDetails.tenantCode,
      subdomain: payload.companyDetails.subdomain,
      industry: payload.companyDetails.industry || undefined,
      tenant_type: payload.companyDetails.tenantType,
      company_email: payload.companyDetails.companyEmail || undefined,
      phone: payload.companyDetails.phone || undefined,
      website: payload.companyDetails.website || undefined,
    },
    location: {
      country: payload.location.country || undefined,
      state: payload.location.state || undefined,
      city: payload.location.city || undefined,
      postal_code: payload.location.postalCode || undefined,
      timezone: payload.location.timezone || undefined,
      currency: payload.location.currency || undefined,
      business_address: payload.location.businessAddress || undefined,
    },
    modules: payload.modules,
    configuration: {
      plan: payload.configuration.plan,
      employee_limit: payload.configuration.employeeLimit,
    },
    branding: {
      logo_object_key: payload.branding.logoObjectKey || undefined,
      primary_brand_color: payload.branding.primaryBrandColor || undefined,
      email_sender_name: payload.branding.emailSenderName || undefined,
      support_email: payload.branding.supportEmail || undefined,
    },
  };
}

function toCreatePayloadDto(payload: CreateTenantPayload) {
  return {
    ...toMutableFieldsDto(payload),
    tenant_admin: {
      first_name: payload.tenantAdmin.firstName,
      last_name: payload.tenantAdmin.lastName,
      work_email: payload.tenantAdmin.workEmail,
      job_title: payload.tenantAdmin.jobTitle || undefined,
      phone: payload.tenantAdmin.phone || undefined,
    },
  };
}

function toUpdatePayloadDto(payload: UpdateTenantPayload) {
  return { ...toMutableFieldsDto(payload), is_active: payload.isActive };
}

export const tenantApi = {
  async list(params: TenantListParams): Promise<PaginatedResponse<TenantListItem>> {
    const { data } = await apiClient.get<PaginatedDto<TenantListItemDto>>(tenantEndpoints.list, {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        is_active: params.isActive,
        plan: params.plan,
        tenant_type: params.tenantType,
      },
    });
    return { items: data.items.map(toTenantListItem), meta: toMeta(data.meta) };
  },

  async getById(id: string): Promise<Tenant> {
    const { data } = await apiClient.get<TenantDto>(tenantEndpoints.detail(id));
    return toTenant(data);
  },

  /** The caller's own tenant — for a logged-in Tenant Admin or Employee. */
  async getMine(): Promise<Tenant> {
    const { data } = await apiClient.get<TenantDto>(tenantEndpoints.mine);
    return toTenant(data);
  },

  async updateEmployeeIdPrefix(employeeIdPrefix: string): Promise<Tenant> {
    const { data } = await apiClient.patch<TenantDto>(tenantEndpoints.updateEmployeeIdPrefix, {
      employee_id_prefix: employeeIdPrefix,
    });
    return toTenant(data);
  },

  async create(payload: CreateTenantPayload): Promise<Tenant> {
    const { data } = await apiClient.post<TenantDto>(
      tenantEndpoints.create,
      toCreatePayloadDto(payload),
    );
    return toTenant(data);
  },

  async update(id: string, payload: UpdateTenantPayload): Promise<Tenant> {
    const { data } = await apiClient.patch<TenantDto>(
      tenantEndpoints.update(id),
      toUpdatePayloadDto(payload),
    );
    return toTenant(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(tenantEndpoints.remove(id));
  },

  async setActive(id: string, isActive: boolean): Promise<Tenant> {
    const { data } = await apiClient.patch<TenantDto>(tenantEndpoints.status(id), {
      is_active: isActive,
    });
    return toTenant(data);
  },

  async uploadLogo(file: File): Promise<LogoUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<LogoUploadDto>(tenantEndpoints.uploadLogo, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { logoObjectKey: data.logo_object_key, previewUrl: data.preview_url };
  },
};
