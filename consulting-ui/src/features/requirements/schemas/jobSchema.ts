import * as Yup from 'yup';
import type {
  EmploymentType,
  JobPriority,
  JobStatus,
  WorkMode,
} from '../types/job.types';

export interface JobFormValues {
  clientId: string;
  jobTitle: string;
  jobType: string;
  employmentType: EmploymentType;
  experienceMin: number;
  experienceMax: number;
  positions: number;
  location: string;
  workMode: WorkMode;
  salaryRange: string;
  priority: JobPriority;
  status: JobStatus;
  skills: string[];
  assignedRecruiters: string[];
  assignedTeamLeads: string[];
  description: string;
}

export const jobInitialValues: JobFormValues = {
  clientId: '',
  jobTitle: '',
  jobType: '',
  employmentType: 'FULL_TIME',
  experienceMin: 0,
  experienceMax: 1,
  positions: 1,
  location: '',
  workMode: 'HYBRID',
  salaryRange: '',
  priority: 'MEDIUM',
  status: 'OPEN',
  skills: [],
  assignedRecruiters: [],
  assignedTeamLeads: [],
  description: '',
};

export const jobValidationSchema: Yup.ObjectSchema<JobFormValues> = Yup.object({
  clientId: Yup.string().required('Client is required'),
  jobTitle: Yup.string().trim().min(2).max(255).required('Job title is required'),
  jobType: Yup.string().trim().max(80).defined(),
  employmentType: Yup.mixed<EmploymentType>()
    .oneOf(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY'])
    .required(),
  experienceMin: Yup.number().min(0).max(60).required('Minimum experience is required'),
  experienceMax: Yup.number()
    .min(0)
    .max(60)
    .required('Maximum experience is required')
    .test('experience-range', 'Must be at least the minimum experience', function (value) {
      return value >= this.parent.experienceMin;
    }),
  positions: Yup.number().integer().min(1).max(10000).required('Positions are required'),
  location: Yup.string().trim().min(2).max(255).required('Location is required'),
  workMode: Yup.mixed<WorkMode>().oneOf(['ONSITE', 'REMOTE', 'HYBRID']).required(),
  salaryRange: Yup.string().trim().max(120).defined(),
  priority: Yup.mixed<JobPriority>().oneOf(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).required(),
  status: Yup.mixed<JobStatus>()
    .oneOf(['OPEN', 'ON_HOLD', 'CLOSED', 'FILLED', 'CANCELLED'])
    .required(),
  skills: Yup.array().of(Yup.string().required()).min(1, 'Add at least one skill').required(),
  assignedRecruiters: Yup.array()
    .of(Yup.string().required())
    .min(1, 'Assign at least one recruiter')
    .required(),
  assignedTeamLeads: Yup.array()
    .of(Yup.string().required())
    .required(),
  description: Yup.string().trim().max(10000).defined(),
});
