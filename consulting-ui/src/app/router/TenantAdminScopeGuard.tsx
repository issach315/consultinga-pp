import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const TENANT_ADMIN_HOME = '/tenant-admin/employees';

/**
 * Tenant admins are scoped to Employees and Requirements only while the
 * rest of the tenant console is still being built out. This mirrors
 * `TENANT_ADMIN_NAV_ITEMS`/`getVisibleNavItems` in `navigation.ts` (which
 * hides the other links) by also blocking direct URL navigation to them.
 * Requirements is allowed here because Tenant Admins get automatic full
 * access to it once their tenant enables the module — without this
 * allow-list they'd be bounced back before RequireModule/RequirePermission
 * even run. Super admins are unaffected even if they also hold the
 * TENANT_ADMIN role.
 */
const TENANT_ADMIN_ALLOWED_PREFIXES = [TENANT_ADMIN_HOME, '/requirements', '/clients'];

function isAllowedForScopedTenantAdmin(pathname: string): boolean {
  return TENANT_ADMIN_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function TenantAdminScopeGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const roleCodes = user?.roles.map((role) => role.code) ?? [];
  const isScopedTenantAdmin = roleCodes.includes('TENANT_ADMIN') && !roleCodes.includes('SUPER_ADMIN');

  if (isScopedTenantAdmin && !isAllowedForScopedTenantAdmin(pathname)) {
    return <Navigate to={TENANT_ADMIN_HOME} replace />;
  }

  return <>{children}</>;
}
