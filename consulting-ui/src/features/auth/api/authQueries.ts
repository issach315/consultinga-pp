import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { authApi } from './authApi';
import type { LoginPayload } from '../types/auth.types';

export function useCurrentUserQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authApi.getCurrentUser,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
