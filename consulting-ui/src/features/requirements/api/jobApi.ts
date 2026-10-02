import { apiClient } from '@/services/api/client';
import { requirementEndpoints } from '@/services/api/endpoints';
import type { PaginatedResponse } from '@/types';
import type {
  EmploymentType,
  Job,
  JobAssignee,
  JobListParams,
  JobPayload,
  JobPriority,
  JobStatus,
  WorkMode,
} from '../types/job.types';

interface JobUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface JobDto {
  id: string;
  tenant_id: string;
  job_code: string;
  client_id: string;
  client: { id: string; client_code: string; company_name: string };
  job_title: string;
  job_type: string | null;
  employment_type: EmploymentType;
  experience_min: number;
  experience_max: number;
  skills: string[];
  positions: number;
  location: string;
  work_mode: WorkMode;
  salary_range: string | null;
  priority: JobPriority;
  status: JobStatus;
  created_by: string;
  creator: JobUserDto;
  assigned_recruiters: JobUserDto[];
  assigned_team_leads: JobUserDto[];
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface AssigneeDto extends JobUserDto {
  employee_id: string;
}

interface PaginatedJobDto {
  items: JobDto[];
  meta: { page: number; page_size: number; total_items: number; total_pages: number };
}

function toJob(dto: JobDto): Job {
  return {
    id: dto.id,
    tenantId: dto.tenant_id,
    jobCode: dto.job_code,
    clientId: dto.client_id,
    client: {
      id: dto.client.id,
      clientCode: dto.client.client_code,
      companyName: dto.client.company_name,
    },
    jobTitle: dto.job_title,
    jobType: dto.job_type,
    employmentType: dto.employment_type,
    experienceMin: dto.experience_min,
    experienceMax: dto.experience_max,
    skills: dto.skills,
    positions: dto.positions,
    location: dto.location,
    workMode: dto.work_mode,
    salaryRange: dto.salary_range,
    priority: dto.priority,
    status: dto.status,
    createdBy: dto.created_by,
    creator: dto.creator,
    assignedRecruiters: dto.assigned_recruiters,
    assignedTeamLeads: dto.assigned_team_leads,
    description: dto.description,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function toDto(payload: JobPayload) {
  return {
    client_id: payload.clientId,
    job_title: payload.jobTitle,
    job_type: payload.jobType || null,
    employment_type: payload.employmentType,
    experience_min: payload.experienceMin,
    experience_max: payload.experienceMax,
    skills: payload.skills,
    positions: payload.positions,
    location: payload.location,
    work_mode: payload.workMode,
    salary_range: payload.salaryRange || null,
    priority: payload.priority,
    ...(payload.status ? { status: payload.status } : {}),
    assigned_recruiters: payload.assignedRecruiters,
    assigned_team_leads: payload.assignedTeamLeads,
    description: payload.description || null,
  };
}

export const jobApi = {
  async list(params: JobListParams): Promise<PaginatedResponse<Job>> {
    const { pageSize, sortBy, sortOrder, clientId, recruiterId, teamLeadId, createdBy, ...rest } = params;
    const { data } = await apiClient.get<PaginatedJobDto>(requirementEndpoints.list, {
      params: {
        ...rest,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        client_id: clientId,
        recruiter_id: recruiterId,
        team_lead_id: teamLeadId,
        created_by: createdBy,
      },
    });
    return {
      items: data.items.map(toJob),
      meta: {
        page: data.meta.page,
        pageSize: data.meta.page_size,
        totalItems: data.meta.total_items,
        totalPages: data.meta.total_pages,
      },
    };
  },

  async getById(id: string): Promise<Job> {
    const { data } = await apiClient.get<JobDto>(requirementEndpoints.detail(id));
    return toJob(data);
  },

  async create(payload: JobPayload): Promise<Job> {
    const { data } = await apiClient.post<JobDto>(requirementEndpoints.create, toDto(payload));
    return toJob(data);
  },

  async update(id: string, payload: JobPayload): Promise<Job> {
    const { data } = await apiClient.put<JobDto>(requirementEndpoints.update(id), toDto(payload));
    return toJob(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(requirementEndpoints.remove(id));
  },

  async listAssignees(role: 'RECRUITER' | 'TEAMLEAD' | 'BDM'): Promise<JobAssignee[]> {
    const { data } = await apiClient.get<AssigneeDto[]>(requirementEndpoints.assignees, {
      params: { role },
    });
    return data.map((entry) => ({ ...entry, employeeId: entry.employee_id }));
  },
};
