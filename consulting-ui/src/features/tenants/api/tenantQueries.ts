import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { tenantApi } from './tenantApi';
import type { CreateTenantPayload, TenantListParams, UpdateTenantPayload } from '../types/tenant.types';

export function useTenantListQuery(params: TenantListParams) {
  return useQuery({
    queryKey: queryKeys.tenants.list(params),
    queryFn: () => tenantApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useTenantDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id ?? ''),
    queryFn: () => tenantApi.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => tenantApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.lists() });
    },
  });
}

export function useUpdateTenantMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) => tenantApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenants.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.lists() });
      // A module toggle changes what the acting admin (if also a tenant
      // member) can see — refresh their effective access immediately.
      queryClient.invalidateQueries({ queryKey: queryKeys.access.all });
    },
  });
}

export function useSetTenantActiveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => tenantApi.setActive(id, isActive),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(queryKeys.tenants.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.lists() });
    },
  });
}

export function useDeleteTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.tenants.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.lists() });
    },
  });
}

export function useUploadTenantLogoMutation() {
  return useMutation({
    mutationFn: (file: File) => tenantApi.uploadLogo(file),
  });
}

/** The caller's own tenant — for a logged-in Tenant Admin or Employee. */
export function useMyTenantQuery() {
  return useQuery({
    queryKey: queryKeys.tenants.mine(),
    queryFn: () => tenantApi.getMine(),
  });
}

export function useUpdateEmployeeIdPrefixMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeIdPrefix: string) => tenantApi.updateEmployeeIdPrefix(employeeIdPrefix),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenants.mine(), updated);
    },
  });
}
