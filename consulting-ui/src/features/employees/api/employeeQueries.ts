import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { employeeApi } from './employeeApi';
import type {
  CreateEmployeePayload,
  EmployeeListParams,
  UpdateEmployeePayload,
} from '../types/employee.types';

export function useEmployeeListQuery(params: EmployeeListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeeApi.list(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useEmployeeDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id ?? ''),
    queryFn: () => employeeApi.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeeApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

export function useUpdateEmployeeMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEmployeePayload) => employeeApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.employees.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.employees.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}
