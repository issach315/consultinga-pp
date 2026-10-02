import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { submissionApi } from './submissionApi';
import type {
  CandidatePayload,
  SubmissionListParams,
  SubmissionPayload,
} from '../types/submission.types';

export function useCandidateListQuery(params: { page: number; pageSize: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.requirements.candidates(params),
    queryFn: () => submissionApi.listCandidates(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCandidateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CandidatePayload) => submissionApi.createCandidate(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...queryKeys.requirements.all, 'candidates'] }),
  });
}

export function useSubmissionListQuery(jobId: string, params: SubmissionListParams) {
  return useQuery({
    queryKey: queryKeys.requirements.submissions(jobId, params),
    queryFn: () => submissionApi.list(jobId, params),
    enabled: Boolean(jobId),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSubmissionMutation(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmissionPayload) => submissionApi.create(jobId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.submissionLists(jobId) }),
  });
}
