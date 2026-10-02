import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setSessionExpiredHandler } from '@/services/api/client';
import { clearTokens, getRefreshToken } from '@/services/api/authToken';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { authApi } from '../api/authApi';
import { useCurrentUserQuery, useLoginMutation, useLogoutMutation } from '../api/authQueries';
import type { LoginPayload } from '../types/auth.types';
import { AuthContext, type AuthContextValue } from './authContextInstance';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasSession, setHasSession] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const currentUserQuery = useCurrentUserQuery(hasSession);
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  // On app load, the access token is gone (it only ever lived in memory).
  // If a refresh token survived the reload, silently exchange it for a
  // fresh access token before rendering protected routes.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getRefreshToken()) {
        setIsBootstrapping(false);
        return;
      }
      try {
        await authApi.refreshSession();
        if (!cancelled) setHasSession(true);
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setHasSession(false);
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      await loginMutation.mutateAsync(payload);
      setHasSession(true);
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    try {
      // Best-effort server-side revocation — local session state is cleared
      // either way, so a network failure here never traps the user signed in.
      await logoutMutation.mutateAsync();
    } catch {
      // Ignored: see above.
    } finally {
      clearTokens();
      setHasSession(false);
    }
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUserQuery.data,
      isAuthenticated: hasSession && Boolean(currentUserQuery.data),
      isInitializing: isBootstrapping || (hasSession && currentUserQuery.isLoading),
      login,
      logout,
    }),
    [currentUserQuery.data, currentUserQuery.isLoading, hasSession, isBootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
