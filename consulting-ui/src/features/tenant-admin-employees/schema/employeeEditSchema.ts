import { z } from 'zod';

/**
 * Edit Details tab schema — a flat form (no wizard steps). Only the four
 * fields the backend has always required stay required here; every
 * employment/profile field is optional so editing an employee that was
 * bulk-onboarded with minimal data doesn't force filling in fields that
 * were never collected.
 */
export const employeeEditSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  preferredName: z.string().max(100).optional().or(z.literal('')),
  personalEmail: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  email: z.string().min(1, 'Work email is required').email('Enter a valid email address'),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  addressLine: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),

  role: z.string().min(1, 'Role is required'),
  department: z.string().optional().or(z.literal('')),
  designation: z.string().optional().or(z.literal('')),
  employmentType: z.string().optional().or(z.literal('')),
  joiningDate: z.string().optional().or(z.literal('')),
  reportingManagerId: z.string().optional().or(z.literal('')),
  workLocation: z.string().optional().or(z.literal('')),
  workMode: z.string().optional().or(z.literal('')),
});

export type EmployeeEditFormValues = z.infer<typeof employeeEditSchema>;
