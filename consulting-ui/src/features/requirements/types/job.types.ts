export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type JobStatus = 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'FILLED' | 'CANCELLED';

export interface JobUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface JobAssignee extends JobUser {
  employeeId: string;
}

export interface JobClient {
  id: string;
  clientCode: string;
  companyName: string;
}

export interface Job {
  id: string;
  tenantId: string;
  jobCode: string;
  clientId: string;
  client: JobClient;
  jobTitle: string;
  jobType: string | null;
  employmentType: EmploymentType;
  experienceMin: number;
  experienceMax: number;
  skills: string[];
  positions: number;
  location: string;
  workMode: WorkMode;
  salaryRange: string | null;
  priority: JobPriority;
  status: JobStatus;
  createdBy: string;
  creator: JobUser;
  assignedRecruiters: JobUser[];
  assignedTeamLeads: JobUser[];
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobPayload {
  clientId: string;
  jobTitle: string;
  jobType?: string;
  employmentType: EmploymentType;
  experienceMin: number;
  experienceMax: number;
  skills: string[];
  positions: number;
  location: string;
  workMode: WorkMode;
  salaryRange?: string;
  priority: JobPriority;
  status?: JobStatus;
  assignedRecruiters: string[];
  assignedTeamLeads: string[];
  description?: string;
}

export interface JobListParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  clientId?: string;
  status?: JobStatus;
  priority?: JobPriority;
  recruiterId?: string;
  teamLeadId?: string;
  createdBy?: string;
}

export const WORK_MODE_OPTIONS: Array<{ value: WorkMode; label: string }> = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
];

export const EMPLOYMENT_TYPE_OPTIONS: Array<{ value: EmploymentType; label: string }> = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
];

export const JOB_PRIORITY_OPTIONS: Array<{ value: JobPriority; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const JOB_STATUS_OPTIONS: Array<{ value: JobStatus; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'FILLED', label: 'Filled' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
