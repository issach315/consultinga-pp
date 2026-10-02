import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AccessDeniedPage } from '@/pages';

/**
 * Authorization guard: assumes the user is already authenticated
 * (nest inside `ProtectedRoute`) and checks their role separately.
 * A user with any one of the listed role codes is granted access.
 */
export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();

  const userRoleCodes = user?.roles.map((role) => role.code) ?? [];
  const isAuthorized = roles.some((role) => userRoleCodes.includes(role));

  if (!isAuthorized) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
