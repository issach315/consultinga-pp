import { useMemo, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffectiveAccessQuery } from '../api/accessQueries';
import type { PermissionAction } from '../types/access.types';
import { AccessContext, type AccessContextValue } from './accessContextInstance';

export function AccessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const accessQuery = useEffectiveAccessQuery(isAuthenticated);
  const access = accessQuery.data;

  const value = useMemo<AccessContextValue>(() => {
    const canAccessModule = (moduleKey: string) => Boolean(access?.modules[moduleKey]?.enabled);

    const canAccessSubModule = (moduleKey: string, subModuleKey: string) => {
      const module = access?.modules[moduleKey];
      return Boolean(module?.enabled && (module.subModules[subModuleKey]?.length ?? 0) > 0);
    };

    const can = (moduleKey: string, subModuleKey: string, action: PermissionAction) => {
      const module = access?.modules[moduleKey];
      return Boolean(module?.enabled && module.subModules[subModuleKey]?.includes(action));
    };

    return {
      access,
      isLoading: isAuthenticated && accessQuery.isLoading,
      canAccessModule,
      canAccessSubModule,
      can,
    };
  }, [access, accessQuery.isLoading, isAuthenticated]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
