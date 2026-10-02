import type { ReactNode } from 'react';
import { useAccess } from '@/features/access';
import { AccessDeniedPage } from '@/pages';

/**
 * Authorization guard: restricts a route to tenants that have the given
 * module enabled. This is the tenant-level gate — it wins over any
 * employee permission, mirroring the backend's require_module dependency.
 */
export function RequireModule({ moduleKey, children }: { moduleKey: string; children: ReactNode }) {
  const { canAccessModule } = useAccess();

  if (!canAccessModule(moduleKey)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
