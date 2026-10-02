import { z } from 'zod';

export const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  status: z.enum(['active', 'inactive', 'on_leave']),
  hireDate: z.string().min(1, 'Hire date is required'),
  salary: z.coerce.number().positive('Salary must be a positive number'),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
