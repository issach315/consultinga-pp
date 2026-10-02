import type { Path } from 'react-hook-form';
import { z } from 'zod';
import type { ModulePermission } from '@/components/form-builder';

const permissionActionSchema = z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE']);

export const employeeOnboardWizardSchema = z.object({
  profile: z.object({
    photoObjectKey: z.string().optional(),
    photoPreviewUrl: z.string().optional(),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    preferredName: z.string().max(100).optional().or(z.literal('')),
    personalEmail: z.string().email('Enter a valid email address').optional().or(z.literal('')),
    workEmail: z.string().min(1, 'Work email is required').email('Enter a valid email address'),
    phone: z.string().optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    addressLine: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    postalCode: z.string().optional().or(z.literal('')),
  }),
  employment: z.object({
    joiningDate: z.string().min(1, 'Joining date is required'),
    role: z.string().min(1, 'Role is required'),
    department: z.string().min(1, 'Department is required'),
    designation: z.string().min(1, 'Designation is required'),
    employmentType: z.string().min(1, 'Employment type is required'),
    reportingManagerId: z.string().optional().or(z.literal('')),
    workLocation: z.string().optional().or(z.literal('')),
    workMode: z.string().optional().or(z.literal('')),
  }),
  access: z.object({
    permissions: z.array(
      z.object({ module: z.string(), actions: z.array(permissionActionSchema) }),
    ) as z.ZodType<ModulePermission[]>,
  }),
});

export type EmployeeOnboardWizardFormValues = z.infer<typeof employeeOnboardWizardSchema>;

export const EMPLOYEE_ONBOARD_WIZARD_DEFAULT_VALUES: EmployeeOnboardWizardFormValues = {
  profile: {
    photoObjectKey: '',
    photoPreviewUrl: '',
    firstName: '',
    lastName: '',
    preferredName: '',
    personalEmail: '',
    workEmail: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  },
  employment: {
    joiningDate: '',
    role: '',
    department: '',
    designation: '',
    employmentType: '',
    reportingManagerId: '',
    workLocation: '',
    workMode: '',
  },
  access: {
    permissions: [],
  },
};

/** Field paths validated before advancing each step. */
export const EMPLOYEE_ONBOARD_STEP_FIELDS: Record<number, Path<EmployeeOnboardWizardFormValues>[]> = {
  1: ['profile.firstName', 'profile.lastName', 'profile.workEmail'],
  2: [
    'employment.joiningDate',
    'employment.role',
    'employment.department',
    'employment.designation',
    'employment.employmentType',
  ],
  3: [],
  4: [],
};
