import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { clientApi } from './clientApi';
import type {
  ClientListParams,
  ClientPayload,
  UpdateClientPayload,
} from '../types/client.types';

export function useClientListQuery(params: ClientListParams) {
  return useQuery({
    queryKey: queryKeys.clients.list(params),
    queryFn: () => clientApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => clientApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() }),
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClientPayload }) =>
      clientApi.update(id, payload),
    onSuccess: (client) => {
      queryClient.setQueryData(queryKeys.clients.detail(client.id), client);
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.clients.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
    },
  });
}
