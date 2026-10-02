export const payrollEndpoints = {
  list: '/payroll',
  detail: (id: string) => `/payroll/${id}`,
} as const;
