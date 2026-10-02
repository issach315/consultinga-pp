import type { PermissionAction } from '@/components/form-builder';

export interface ModuleAccess {
  enabled: boolean;
  subModules: Record<string, PermissionAction[]>;
}

export interface EffectiveAccess {
  modules: Record<string, ModuleAccess>;
}

export type { PermissionAction };
