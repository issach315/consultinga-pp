import type { PermissionMatrixModuleDef } from '@/components/form-builder';
import { MODULE_DEFS } from '@/features/tenants/constants/plans';
import { REQUIREMENTS_MODULE_KEY, REQUIREMENTS_SUB_MODULES } from '@/features/requirements/constants';
import { joinCompositeModuleKey, splitCompositeModuleKey } from '@/features/requirements/utils/compositeModuleKey';

export function getModuleRowLabel(key: string): string {
  const { module, subModule } = splitCompositeModuleKey(key);
  if (module === REQUIREMENTS_MODULE_KEY && subModule) {
    const label = REQUIREMENTS_SUB_MODULES.find((entry) => entry.key === subModule)?.label ?? subModule;
    return `Requirements — ${label}`;
  }
  return MODULE_DEFS.find((entry) => entry.key === module)?.name ?? key;
}

/**
 * Builds the row set for the permission-matrix field from a tenant's
 * enabled modules. Requirements is hierarchical, so it expands into one
 * row per sub-module (keyed "requirements:clients", etc. — see
 * compositeModuleKey) instead of a single flat row; every other module
 * passes through MODULE_DEFS unchanged, exactly as before.
 */
export function buildModuleRows(enabledModules: string[]): PermissionMatrixModuleDef[] {
  return enabledModules.flatMap((key) => {
    if (key === REQUIREMENTS_MODULE_KEY) {
      return REQUIREMENTS_SUB_MODULES.map((sub) => ({
        key: joinCompositeModuleKey(REQUIREMENTS_MODULE_KEY, sub.key),
        name: `Requirements — ${sub.label}`,
      }));
    }
    return [{ key, name: getModuleRowLabel(key) }];
  });
}
