import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { jobApi } from './jobApi';
import type { JobListParams, JobPayload } from '../types/job.types';

export function useJobListQuery(params: JobListParams) {
  return useQuery({
    queryKey: queryKeys.requirements.list(params),
    queryFn: () => jobApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useJobDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.requirements.detail(id ?? ''),
    queryFn: () => jobApi.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useJobAssigneesQuery(role: 'RECRUITER' | 'TEAMLEAD' | 'BDM') {
  return useQuery({
    queryKey: queryKeys.requirements.assignees(role),
    queryFn: () => jobApi.listAssignees(role),
    staleTime: 60_000,
  });
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JobPayload) => jobApi.create(payload),
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.requirements.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.lists() });
    },
  });
}

export function useUpdateJobMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JobPayload) => jobApi.update(id, payload),
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.requirements.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.lists() });
    },
  });
}
