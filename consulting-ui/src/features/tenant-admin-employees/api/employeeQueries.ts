import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { tenantAdminEmployeeApi } from './employeeApi';
import type {
  CreateTenantEmployeePayload,
  ModulePermission,
  TenantEmployeeListParams,
  TenantEmployeeStatus,
  UpdateTenantEmployeePayload,
} from '../types/employee.types';

export function useTenantAdminEmployeeSummaryQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tenantAdminEmployees.summary(tenantId ?? ''),
    queryFn: () => tenantAdminEmployeeApi.getSummary(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useTenantAdminEmployeeListQuery(
  tenantId: string | undefined,
  params: TenantEmployeeListParams,
) {
  return useQuery({
    queryKey: queryKeys.tenantAdminEmployees.list({ tenantId, ...params }),
    queryFn: () => tenantAdminEmployeeApi.list(tenantId as string, params),
    enabled: Boolean(tenantId),
    placeholderData: keepPreviousData,
  });
}

export function useTenantAdminEmployeeDetailQuery(tenantId: string | undefined, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tenantAdminEmployees.detail(id ?? ''),
    queryFn: () => tenantAdminEmployeeApi.getById(tenantId as string, id as string),
    enabled: Boolean(tenantId) && Boolean(id),
  });
}

export function useCreateTenantAdminEmployeeMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTenantEmployeePayload) =>
      tenantAdminEmployeeApi.create(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.summaries() });
    },
  });
}

export function useUploadEmployeePhotoMutation(tenantId: string) {
  return useMutation({
    mutationFn: (file: File) => tenantAdminEmployeeApi.uploadPhoto(tenantId, file),
  });
}

export function useUpdateTenantAdminEmployeeMutation(tenantId: string, id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTenantEmployeePayload) =>
      tenantAdminEmployeeApi.update(tenantId, id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenantAdminEmployees.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.lists() });
    },
  });
}

export function useUpdateTenantAdminEmployeeStatusMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TenantEmployeeStatus }) =>
      tenantAdminEmployeeApi.updateStatus(tenantId, id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenantAdminEmployees.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.summaries() });
    },
  });
}

export function useUpdateTenantAdminEmployeePermissionsMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: ModulePermission[] }) =>
      tenantAdminEmployeeApi.updatePermissions(tenantId, id, permissions),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenantAdminEmployees.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.summaries() });
      // If the acting admin is viewing their own effective access anywhere,
      // keep it consistent too; the affected employee's own session picks
      // this up on next refetch (staleTime/refetchOnWindowFocus).
      queryClient.invalidateQueries({ queryKey: queryKeys.access.all });
    },
  });
}

export function useReissueInvitationMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantAdminEmployeeApi.reissueInvitation(tenantId, id),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenantAdminEmployees.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.lists() });
    },
  });
}

export function useBulkCreateEmployeesMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employees: CreateTenantEmployeePayload[]) =>
      tenantAdminEmployeeApi.bulkCreate(tenantId, employees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantAdminEmployees.summaries() });
    },
  });
}
