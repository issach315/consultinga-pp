import { createContext } from 'react';
import type { EffectiveAccess, PermissionAction } from '../types/access.types';

export interface AccessContextValue {
  access: EffectiveAccess | undefined;
  isLoading: boolean;
  canAccessModule: (moduleKey: string) => boolean;
  canAccessSubModule: (moduleKey: string, subModuleKey: string) => boolean;
  can: (moduleKey: string, subModuleKey: string, action: PermissionAction) => boolean;
}

export const AccessContext = createContext<AccessContextValue | undefined>(undefined);
