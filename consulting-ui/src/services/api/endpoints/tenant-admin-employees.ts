export const tenantAdminEmployeeEndpoints = {
  list: (tenantId: string) => `/tenants/${tenantId}/employees`,
  create: (tenantId: string) => `/tenants/${tenantId}/employees`,
  detail: (tenantId: string, employeeId: string) => `/tenants/${tenantId}/employees/${employeeId}`,
  update: (tenantId: string, employeeId: string) => `/tenants/${tenantId}/employees/${employeeId}`,
  status: (tenantId: string, employeeId: string) =>
    `/tenants/${tenantId}/employees/${employeeId}/status`,
  permissions: (tenantId: string, employeeId: string) =>
    `/tenants/${tenantId}/employees/${employeeId}/permissions`,
  invitation: (tenantId: string, employeeId: string) =>
    `/tenants/${tenantId}/employees/${employeeId}/invitation`,
  bulkCreate: (tenantId: string) => `/tenants/${tenantId}/employees/bulk`,
  summary: (tenantId: string) => `/tenants/${tenantId}/employees/summary`,
  uploadPhoto: (tenantId: string) => `/tenants/${tenantId}/employees/photo`,
} as const;
