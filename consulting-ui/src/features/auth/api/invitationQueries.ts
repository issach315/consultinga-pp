import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { invitationApi } from './invitationApi';

export function useInvitationDetailQuery(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invitations.detail(token ?? ''),
    queryFn: () => invitationApi.getDetail(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useAcceptInvitationMutation(token: string) {
  return useMutation({
    mutationFn: (password: string) => invitationApi.accept(token, password),
  });
}
