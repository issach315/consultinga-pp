import type { SelectOption } from '@/components/form-builder';
import type { TenantTypeId } from '@/features/tenants/constants/tenantType';

export interface RoleDef {
  id: string;
  label: string;
  /** Tenant types this role is offered to. Extend here to add a role — the page never needs to change. */
  tenantTypes: TenantTypeId[];
}

export const ROLE_DEFS: RoleDef[] = [
  { id: 'RECRUITER', label: 'Recruiter', tenantTypes: ['Domestic', 'Hybrid'] },
  { id: 'BDM', label: 'BDM', tenantTypes: ['Domestic', 'Hybrid'] },
  { id: 'TEAMLEAD', label: 'Team Lead', tenantTypes: ['Domestic', 'Hybrid'] },
  { id: 'COORDINATOR', label: 'Coordinator', tenantTypes: ['Domestic', 'Hybrid'] },
  { id: 'HR', label: 'HR', tenantTypes: ['Domestic', 'Hybrid'] },
];

export function getRoleOptionsForTenantType(tenantType: TenantTypeId): SelectOption[] {
  return ROLE_DEFS.filter((role) => role.tenantTypes.includes(tenantType)).map((role) => ({
    label: role.label,
    value: role.id,
  }));
}

export function getRoleLabel(roleId: string): string {
  return ROLE_DEFS.find((role) => role.id === roleId)?.label ?? roleId;
}
