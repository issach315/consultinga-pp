export interface EmploymentOption {
  value: string;
  label: string;
}

export const DEPARTMENT_OPTIONS: EmploymentOption[] = [
  { value: 'Recruitment', label: 'Recruitment' },
  { value: 'Sales', label: 'Sales / Business Development' },
  { value: 'Operations', label: 'Operations' },
  { value: 'HR', label: 'HR' },
  { value: 'Administration', label: 'Administration' },
];

export const DESIGNATION_OPTIONS: EmploymentOption[] = [
  { value: 'Senior Recruiter', label: 'Senior Recruiter' },
  { value: 'Recruiter', label: 'Recruiter' },
  { value: 'Junior Recruiter', label: 'Junior Recruiter' },
  { value: 'Business Development Executive', label: 'Business Development Executive' },
  { value: 'Team Lead', label: 'Team Lead' },
];

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentOption[] = [
  { value: 'Full Time', label: 'Full Time' },
  { value: 'Part Time', label: 'Part Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Intern', label: 'Intern' },
];

export const WORK_LOCATION_OPTIONS: EmploymentOption[] = [
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Other', label: 'Other' },
];

export const WORK_MODE_OPTIONS: EmploymentOption[] = [
  { value: 'Office', label: 'Office' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Remote', label: 'Remote' },
];

export const GENDER_OPTIONS: EmploymentOption[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];
