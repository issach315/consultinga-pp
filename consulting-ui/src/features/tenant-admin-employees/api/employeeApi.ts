import { apiClient } from '@/services/api/client';
import { tenantAdminEmployeeEndpoints } from '@/services/api/endpoints';
import type { PaginatedResponse, PaginationMeta } from '@/types';
import {
  joinCompositeModuleKey,
  splitCompositeModuleKey,
} from '@/features/requirements/utils/compositeModuleKey';
import type {
  BulkCreateTenantEmployeesResult,
  BulkEmployeeResult,
  CreateTenantEmployeePayload,
  EmployeePhotoUploadResult,
  ModulePermission,
  TenantEmployee,
  TenantEmployeeListParams,
  TenantEmployeeStatus,
  TenantEmployeeSummary,
  UpdateTenantEmployeePayload,
} from '../types/employee.types';

interface TenantEmployeePermissionDto {
  module: string;
  sub_module: string | null;
  actions: string[];
}

interface TenantEmployeeDto {
  id: string;
  tenant_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  permissions: TenantEmployeePermissionDto[];
  created_at: string;
  updated_at: string;

  joining_date: string | null;
  department: string | null;
  designation: string | null;
  employment_type: string | null;
  work_location: string | null;
  work_mode: string | null;
  reporting_manager_id: string | null;

  preferred_name: string | null;
  personal_email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  profile_photo_url: string | null;
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

function toMeta(dto: PaginationMetaDto): PaginationMeta {
  return {
    page: dto.page,
    pageSize: dto.page_size,
    totalItems: dto.total_items,
    totalPages: dto.total_pages,
  };
}

function toEmployee(dto: TenantEmployeeDto): TenantEmployee {
  return {
    id: dto.id,
    tenantId: dto.tenant_id,
    employeeId: dto.employee_code,
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    role: dto.role,
    status: dto.status as TenantEmployeeStatus,
    permissions: dto.permissions.map((entry) => ({
      module: entry.sub_module ? joinCompositeModuleKey(entry.module, entry.sub_module) : entry.module,
      actions: entry.actions as ModulePermission['actions'],
    })),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    joiningDate: dto.joining_date,
    department: dto.department,
    designation: dto.designation,
    employmentType: dto.employment_type,
    workLocation: dto.work_location,
    workMode: dto.work_mode,
    reportingManagerId: dto.reporting_manager_id,
    preferredName: dto.preferred_name,
    personalEmail: dto.personal_email,
    phone: dto.phone,
    dateOfBirth: dto.date_of_birth,
    gender: dto.gender,
    addressLine: dto.address_line,
    city: dto.city,
    state: dto.state,
    postalCode: dto.postal_code,
    profilePhotoUrl: dto.profile_photo_url,
    inviteEmailSent: dto.invite_email_sent,
  };
}

function toPermissionsDto(permissions: ModulePermission[]): TenantEmployeePermissionDto[] {
  return permissions.map((entry) => {
    const { module, subModule } = splitCompositeModuleKey(entry.module);
    return { module, sub_module: subModule, actions: entry.actions };
  });
}

/** Shared by create and update — fields absent from a partial update payload
 * serialize as `undefined` and JSON.stringify drops them, so the backend's
 * exclude-unset handling leaves those fields untouched rather than clearing them. */
function toOptionalFieldsDto(payload: Partial<CreateTenantEmployeePayload>) {
  return {
    joining_date: payload.joiningDate,
    department: payload.department,
    designation: payload.designation,
    employment_type: payload.employmentType,
    work_location: payload.workLocation,
    work_mode: payload.workMode,
    reporting_manager_id: payload.reportingManagerId,
    preferred_name: payload.preferredName,
    personal_email: payload.personalEmail,
    phone: payload.phone,
    date_of_birth: payload.dateOfBirth,
    gender: payload.gender,
    address_line: payload.addressLine,
    city: payload.city,
    state: payload.state,
    postal_code: payload.postalCode,
    profile_photo_key: payload.profilePhotoKey,
  };
}

function toCreateDto(payload: CreateTenantEmployeePayload) {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    work_email: payload.email,
    role: payload.role,
    permissions: toPermissionsDto(payload.permissions),
    ...toOptionalFieldsDto(payload),
  };
}

interface BulkEmployeeResultDto {
  index: number;
  status: 'created' | 'failed';
  employee: TenantEmployeeDto | null;
  error: string | null;
}

interface BulkCreateResponseDto {
  results: BulkEmployeeResultDto[];
  created_count: number;
  failed_count: number;
}

function toBulkResult(dto: BulkEmployeeResultDto): BulkEmployeeResult {
  return {
    index: dto.index,
    status: dto.status,
    employee: dto.employee ? toEmployee(dto.employee) : null,
    error: dto.error,
  };
}

interface EmployeeSummaryDto {
  total: number;
  active: number;
  invited: number;
  inactive: number;
  avg_permission_grant_pct: number;
}

function toSummary(dto: EmployeeSummaryDto): TenantEmployeeSummary {
  return {
    total: dto.total,
    active: dto.active,
    invited: dto.invited,
    inactive: dto.inactive,
    avgPermissionGrantPct: dto.avg_permission_grant_pct,
  };
}

export const tenantAdminEmployeeApi = {
  async list(
    tenantId: string,
    params: TenantEmployeeListParams,
  ): Promise<PaginatedResponse<TenantEmployee>> {
    const { data } = await apiClient.get<PaginatedDto<TenantEmployeeDto>>(
      tenantAdminEmployeeEndpoints.list(tenantId),
      {
        params: {
          page: params.page,
          page_size: params.pageSize,
          search: params.search,
          sort_by: params.sortBy,
          sort_order: params.sortOrder,
          roles: params.roles,
          statuses: params.statuses,
        },
        // FastAPI's list[str] query params expect repeated bare keys
        // ("roles=A&roles=B"), not axios's default "roles[]=A&roles[]=B".
        paramsSerializer: { indexes: null },
      },
    );
    return { items: data.items.map(toEmployee), meta: toMeta(data.meta) };
  },

  async getById(tenantId: string, id: string): Promise<TenantEmployee> {
    const { data } = await apiClient.get<TenantEmployeeDto>(
      tenantAdminEmployeeEndpoints.detail(tenantId, id),
    );
    return toEmployee(data);
  },

  async create(tenantId: string, payload: CreateTenantEmployeePayload): Promise<TenantEmployee> {
    const { data } = await apiClient.post<TenantEmployeeDto>(
      tenantAdminEmployeeEndpoints.create(tenantId),
      toCreateDto(payload),
    );
    return toEmployee(data);
  },

  async uploadPhoto(tenantId: string, file: File): Promise<EmployeePhotoUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ photo_object_key: string; preview_url: string }>(
      tenantAdminEmployeeEndpoints.uploadPhoto(tenantId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return { photoObjectKey: data.photo_object_key, previewUrl: data.preview_url };
  },

  async update(
    tenantId: string,
    id: string,
    payload: UpdateTenantEmployeePayload,
  ): Promise<TenantEmployee> {
    const { data } = await apiClient.patch<TenantEmployeeDto>(
      tenantAdminEmployeeEndpoints.update(tenantId, id),
      {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        role: payload.role,
        ...toOptionalFieldsDto(payload),
      },
    );
    return toEmployee(data);
  },

  async updateStatus(
    tenantId: string,
    id: string,
    status: TenantEmployeeStatus,
  ): Promise<TenantEmployee> {
    const { data } = await apiClient.patch<TenantEmployeeDto>(
      tenantAdminEmployeeEndpoints.status(tenantId, id),
      { status },
    );
    return toEmployee(data);
  },

  async updatePermissions(
    tenantId: string,
    id: string,
    permissions: ModulePermission[],
  ): Promise<TenantEmployee> {
    const { data } = await apiClient.put<TenantEmployeeDto>(
      tenantAdminEmployeeEndpoints.permissions(tenantId, id),
      { permissions: toPermissionsDto(permissions) },
    );
    return toEmployee(data);
  },

  async reissueInvitation(tenantId: string, id: string): Promise<TenantEmployee> {
    const { data } = await apiClient.post<TenantEmployeeDto>(
      tenantAdminEmployeeEndpoints.invitation(tenantId, id),
    );
    return toEmployee(data);
  },

  async bulkCreate(
    tenantId: string,
    employees: CreateTenantEmployeePayload[],
  ): Promise<BulkCreateTenantEmployeesResult> {
    const { data } = await apiClient.post<BulkCreateResponseDto>(
      tenantAdminEmployeeEndpoints.bulkCreate(tenantId),
      { employees: employees.map(toCreateDto) },
    );
    return {
      results: data.results.map(toBulkResult),
      createdCount: data.created_count,
      failedCount: data.failed_count,
    };
  },

  async getSummary(tenantId: string): Promise<TenantEmployeeSummary> {
    const { data } = await apiClient.get<EmployeeSummaryDto>(
      tenantAdminEmployeeEndpoints.summary(tenantId),
    );
    return toSummary(data);
  },
};
