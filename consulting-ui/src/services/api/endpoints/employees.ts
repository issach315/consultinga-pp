export const employeeEndpoints = {
  list: '/employees',
  detail: (id: string) => `/employees/${id}`,
} as const;
