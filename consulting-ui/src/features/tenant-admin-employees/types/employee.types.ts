import type { ModulePermission, PermissionAction } from '@/components/form-builder';

export type { ModulePermission, PermissionAction };

export type TenantEmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED';

export interface TenantEmployee {
  id: string;
  tenantId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: TenantEmployeeStatus;
  permissions: ModulePermission[];
  createdAt: string;
  updatedAt: string;

  joiningDate: string | null;
  department: string | null;
  designation: string | null;
  employmentType: string | null;
  workLocation: string | null;
  workMode: string | null;
  reportingManagerId: string | null;

  preferredName: string | null;
  personalEmail: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  profilePhotoUrl: string | null;
  /** null when no invite email was attempted in this request; true/false is the actual send outcome. */
  inviteEmailSent: boolean | null;
}

export interface TenantEmployeeListParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Multi-value filters. */
  roles?: string[];
  statuses?: TenantEmployeeStatus[];
}

export interface CreateTenantEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: ModulePermission[];

  joiningDate?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  workLocation?: string;
  workMode?: string;
  reportingManagerId?: string;

  preferredName?: string;
  personalEmail?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  profilePhotoKey?: string;
}

/** firstName/lastName/email/role are the only fields the quick-edit dialog
 * always sends; every other field is optional and, per the backend's
 * exclude-unset semantics, only overwrites the employee record when the
 * caller actually includes it — omitting a field leaves it untouched. */
export type UpdateTenantEmployeePayload = Partial<Omit<CreateTenantEmployeePayload, 'permissions'>>;

export interface EmployeePhotoUploadResult {
  photoObjectKey: string;
  previewUrl: string;
}

export interface BulkEmployeeResult {
  index: number;
  status: 'created' | 'failed';
  employee: TenantEmployee | null;
  error: string | null;
}

export interface BulkCreateTenantEmployeesResult {
  results: BulkEmployeeResult[];
  createdCount: number;
  failedCount: number;
}

export interface TenantEmployeeSummary {
  total: number;
  active: number;
  invited: number;
  inactive: number;
  avgPermissionGrantPct: number;
}
