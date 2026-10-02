import type { ReactNode } from 'react';
import { useAccess } from '@/features/access';
import type { PermissionAction } from '@/features/access';
import { AccessDeniedPage } from '@/pages';

/**
 * Authorization guard: restricts a route to users whose effective access
 * grants at least READ on the given sub-module. `can()` requires the
 * parent module to be enabled first, so this single guard already encodes
 * "tenant gate wins over employee permission" — routes only need this one
 * guard, not RequireModule stacked on top of it.
 */
export function RequirePermission({
  moduleKey,
  subModuleKey,
  action = 'READ',
  children,
}: {
  moduleKey: string;
  subModuleKey: string;
  action?: PermissionAction;
  children: ReactNode;
}) {
  const { can } = useAccess();

  if (!can(moduleKey, subModuleKey, action)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
