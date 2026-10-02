import { apiClient } from '@/services/api/client';
import { requirementEndpoints } from '@/services/api/endpoints';
import type { PaginatedResponse } from '@/types';
import type {
  Candidate,
  CandidatePayload,
  Submission,
  SubmissionListParams,
  SubmissionPayload,
  SubmissionStatus,
} from '../types/submission.types';

interface CandidateDto {
  id: string;
  candidate_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  current_location: string | null;
  total_experience: number;
  resume_object_key: string | null;
  resume_file_name: string | null;
  resume_version: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

interface SubmissionDto {
  id: string;
  submission_code: string;
  requirement_id: string;
  job_code: string;
  job_title: string;
  candidate_id: string;
  candidate: {
    candidate_code: string;
    name: string;
    email: string;
    phone: string;
    current_location: string | null;
    total_experience: number;
  };
  relevant_experience: number;
  current_ctc: number | null;
  expected_ctc: number | null;
  ctc_currency: string;
  ctc_period: string;
  notice_period_days: number;
  submitted_by: string;
  submitter: { id: string; name: string; email: string };
  submitter_role_snapshot: string;
  status: SubmissionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PageDto<T> {
  items: T[];
  meta: { page: number; page_size: number; total_items: number; total_pages: number };
}

function toCandidate(dto: CandidateDto): Candidate {
  return {
    id: dto.id,
    candidateCode: dto.candidate_code,
    firstName: dto.first_name,
    lastName: dto.last_name,
    fullName: dto.full_name,
    email: dto.email,
    phone: dto.phone,
    currentLocation: dto.current_location,
    totalExperience: dto.total_experience,
    resumeObjectKey: dto.resume_object_key,
    resumeFileName: dto.resume_file_name,
    resumeVersion: dto.resume_version,
    status: dto.status,
    createdAt: dto.created_at,
  };
}

function toSubmission(dto: SubmissionDto): Submission {
  return {
    id: dto.id,
    submissionCode: dto.submission_code,
    requirementId: dto.requirement_id,
    jobCode: dto.job_code,
    jobTitle: dto.job_title,
    candidateId: dto.candidate_id,
    candidate: {
      candidateCode: dto.candidate.candidate_code,
      name: dto.candidate.name,
      email: dto.candidate.email,
      phone: dto.candidate.phone,
      currentLocation: dto.candidate.current_location,
      totalExperience: dto.candidate.total_experience,
    },
    relevantExperience: dto.relevant_experience,
    currentCtc: dto.current_ctc,
    expectedCtc: dto.expected_ctc,
    ctcCurrency: dto.ctc_currency,
    ctcPeriod: dto.ctc_period,
    noticePeriodDays: dto.notice_period_days,
    submittedBy: dto.submitted_by,
    submitter: dto.submitter,
    submitterRoleSnapshot: dto.submitter_role_snapshot,
    status: dto.status,
    notes: dto.notes,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function page<TDto, T>(dto: PageDto<TDto>, mapper: (item: TDto) => T): PaginatedResponse<T> {
  return {
    items: dto.items.map(mapper),
    meta: {
      page: dto.meta.page,
      pageSize: dto.meta.page_size,
      totalItems: dto.meta.total_items,
      totalPages: dto.meta.total_pages,
    },
  };
}

export const submissionApi = {
  async listCandidates(params: { page: number; pageSize: number; search?: string }) {
    const { data } = await apiClient.get<PageDto<CandidateDto>>(requirementEndpoints.candidates, {
      params: { page: params.page, page_size: params.pageSize, search: params.search },
    });
    return page(data, toCandidate);
  },

  async createCandidate(payload: CandidatePayload) {
    const { data } = await apiClient.post<CandidateDto>(requirementEndpoints.candidates, {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      current_location: payload.currentLocation || null,
      total_experience: payload.totalExperience,
      employment_history: (payload.employmentHistory ?? []).map((item) => ({
        company_name: item.companyName,
        designation: item.designation,
        employment_type: item.employmentType,
        start_date: item.startDate,
        end_date: item.endDate || null,
        is_current: item.isCurrent,
      })),
      resume_object_key: payload.resumeObjectKey || null,
      resume_file_name: payload.resumeFileName || null,
    });
    return toCandidate(data);
  },

  async list(jobId: string, params: SubmissionListParams) {
    const { data } = await apiClient.get<PageDto<SubmissionDto>>(
      requirementEndpoints.submissions(jobId),
      {
        params: {
          page: params.page,
          page_size: params.pageSize,
          search: params.search,
          status: params.status,
        },
      },
    );
    return page(data, toSubmission);
  },

  async create(jobId: string, payload: SubmissionPayload) {
    const { data } = await apiClient.post<SubmissionDto>(requirementEndpoints.submissions(jobId), {
      candidate_id: payload.candidateId,
      relevant_experience: payload.relevantExperience,
      current_ctc: payload.currentCtc ?? null,
      expected_ctc: payload.expectedCtc ?? null,
      ctc_currency: payload.ctcCurrency,
      ctc_period: payload.ctcPeriod,
      notice_period_days: payload.noticePeriodDays,
      resume_object_key: payload.resumeObjectKey || null,
      resume_file_name: payload.resumeFileName || null,
      notes: payload.notes || null,
    });
    return toSubmission(data);
  },
};
