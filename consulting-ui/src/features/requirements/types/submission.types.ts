export type SubmissionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFERED'
  | 'PLACED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface EmploymentHistoryItem {
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface Candidate {
  id: string;
  candidateCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string | null;
  totalExperience: number;
  resumeObjectKey: string | null;
  resumeFileName: string | null;
  resumeVersion: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentLocation?: string;
  totalExperience: number;
  employmentHistory?: EmploymentHistoryItem[];
  resumeObjectKey?: string;
  resumeFileName?: string;
}

export interface Submission {
  id: string;
  submissionCode: string;
  requirementId: string;
  jobCode: string;
  jobTitle: string;
  candidateId: string;
  candidate: {
    candidateCode: string;
    name: string;
    email: string;
    phone: string;
    currentLocation: string | null;
    totalExperience: number;
  };
  relevantExperience: number;
  currentCtc: number | null;
  expectedCtc: number | null;
  ctcCurrency: string;
  ctcPeriod: string;
  noticePeriodDays: number;
  submittedBy: string;
  submitter: { id: string; name: string; email: string };
  submitterRoleSnapshot: string;
  status: SubmissionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionPayload {
  candidateId: string;
  relevantExperience: number;
  currentCtc?: number;
  expectedCtc?: number;
  ctcCurrency: string;
  ctcPeriod: 'ANNUAL' | 'MONTHLY' | 'HOURLY';
  noticePeriodDays: number;
  resumeObjectKey?: string;
  resumeFileName?: string;
  notes?: string;
}

export interface SubmissionListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: SubmissionStatus;
}

export const SUBMISSION_STATUS_OPTIONS: Array<{ value: SubmissionStatus; label: string }> = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview scheduled' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];
