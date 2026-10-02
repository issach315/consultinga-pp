import { apiClient } from '@/services/api/client';
import { accessEndpoints } from '@/services/api/endpoints';
import type { EffectiveAccess, ModuleAccess, PermissionAction } from '../types/access.types';

interface ModuleAccessDto {
  enabled: boolean;
  sub_modules: Record<string, PermissionAction[]>;
}

interface EffectiveAccessDto {
  modules: Record<string, ModuleAccessDto>;
}

function toModuleAccess(dto: ModuleAccessDto): ModuleAccess {
  return { enabled: dto.enabled, subModules: dto.sub_modules };
}

function toEffectiveAccess(dto: EffectiveAccessDto): EffectiveAccess {
  const modules: Record<string, ModuleAccess> = {};
  for (const [key, value] of Object.entries(dto.modules)) {
    modules[key] = toModuleAccess(value);
  }
  return { modules };
}

export const accessApi = {
  async getMine(): Promise<EffectiveAccess> {
    const { data } = await apiClient.get<EffectiveAccessDto>(accessEndpoints.me);
    return toEffectiveAccess(data);
  },
};
