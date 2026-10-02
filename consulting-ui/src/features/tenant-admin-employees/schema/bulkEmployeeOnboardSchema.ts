import type { Path } from 'react-hook-form';
import { z } from 'zod';
import type { ModulePermission } from '@/components/form-builder';

const permissionActionSchema = z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE']);

export const bulkEmployeeRowSchema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  email: z.string().min(1, 'Required').email('Enter a valid email'),
  department: z.string().max(100).optional().or(z.literal('')),
  role: z.string().min(1, 'Required'),
  permissions: z.array(
    z.object({ module: z.string(), actions: z.array(permissionActionSchema) }),
  ) as z.ZodType<ModulePermission[]>,
});

export const bulkEmployeeOnboardSchema = z.object({
  employees: z.array(bulkEmployeeRowSchema).min(1, 'Add at least one employee'),
});

export type BulkEmployeeRowValues = z.infer<typeof bulkEmployeeRowSchema>;
export type BulkEmployeeOnboardFormValues = z.infer<typeof bulkEmployeeOnboardSchema>;

export function emptyBulkEmployeeRow(): BulkEmployeeRowValues {
  return { firstName: '', lastName: '', email: '', department: '', role: '', permissions: [] };
}

export const BULK_EMPLOYEE_ONBOARD_DEFAULT_VALUES: BulkEmployeeOnboardFormValues = {
  employees: [emptyBulkEmployeeRow()],
};

/** Field paths validated before advancing past a given step, for the current row count. */
export function getBulkStepFields(step: number, rowCount: number): Path<BulkEmployeeOnboardFormValues>[] {
  const rows = Array.from({ length: rowCount }, (_, i) => i);
  if (step === 1) {
    return rows.flatMap((i) => [
      `employees.${i}.firstName` as const,
      `employees.${i}.lastName` as const,
      `employees.${i}.email` as const,
      `employees.${i}.role` as const,
    ]);
  }
  return [];
}
