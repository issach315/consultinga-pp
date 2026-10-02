import type { PermissionAction } from '@/components/form-builder';
import type { TenantEmployeeStatus } from '../types/employee.types';

export const PERMISSION_ACTIONS: PermissionAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

export const EMPLOYEE_STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  INVITED: 'Invited',
} as const;

const EMPLOYEE_STATUS_TONES = {
  ACTIVE: 'success',
  INVITED: 'warning',
  INACTIVE: 'default',
} as const;

export function employeeStatusTone(status: TenantEmployeeStatus) {
  return EMPLOYEE_STATUS_TONES[status];
}
