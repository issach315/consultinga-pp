import type { ModulePermission, PermissionAction } from '@/components/form-builder';
import { joinCompositeModuleKey, splitCompositeModuleKey } from '@/features/requirements/utils/compositeModuleKey';

const REQUIREMENTS_CLIENTS_KEY = joinCompositeModuleKey('requirements', 'clients');
const REQUIREMENTS_JOBS_KEY = joinCompositeModuleKey('requirements', 'requirements');

/**
 * Typical permission grants per job-function role, expressed as module key
 * -> actions. Purely a starting point for onboarding — always editable
 * afterward, and filtered down to whatever modules the tenant actually has
 * enabled (see getRoleDefaultPermissionsMap).
 */
const ROLE_DEFAULT_MODULE_ACTIONS: Record<string, Record<string, PermissionAction[]>> = {
  RECRUITER: {
    recruitment: ['CREATE', 'READ', 'UPDATE'],
    [REQUIREMENTS_CLIENTS_KEY]: ['READ'],
    [REQUIREMENTS_JOBS_KEY]: ['READ'],
    employees: ['READ'],
  },
  BDM: {
    [REQUIREMENTS_CLIENTS_KEY]: ['CREATE', 'READ', 'UPDATE'],
    [REQUIREMENTS_JOBS_KEY]: ['CREATE', 'READ', 'UPDATE'],
    recruitment: ['READ'],
    invoices: ['READ'],
    reports: ['READ'],
  },
  TEAMLEAD: {
    [REQUIREMENTS_JOBS_KEY]: ['READ'],
    recruitment: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    employees: ['READ', 'UPDATE'],
    attendance: ['READ', 'UPDATE'],
    reports: ['READ'],
  },
  COORDINATOR: {
    recruitment: ['READ', 'UPDATE'],
    attendance: ['READ'],
    events: ['CREATE', 'READ', 'UPDATE'],
  },
  HR: {
    employees: ['CREATE', 'READ', 'UPDATE'],
    attendance: ['CREATE', 'READ', 'UPDATE'],
    payroll: ['READ'],
    events: ['CREATE', 'READ', 'UPDATE'],
  },
};

/** Role -> its default grants, limited to modules the tenant actually has enabled. */
export function getRoleDefaultPermissionsMap(enabledModules: string[]): Record<string, ModulePermission[]> {
  const enabled = new Set(enabledModules);
  const map: Record<string, ModulePermission[]> = {};
  for (const [role, moduleActions] of Object.entries(ROLE_DEFAULT_MODULE_ACTIONS)) {
    map[role] = Object.entries(moduleActions)
      .filter(([moduleKey]) => enabled.has(splitCompositeModuleKey(moduleKey).module))
      .map(([module, actions]) => ({ module, actions }));
  }
  return map;
}
