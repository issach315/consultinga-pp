export const tenantEndpoints = {
  list: '/tenants',
  detail: (id: string) => `/tenants/${id}`,
  create: '/tenants',
  uploadLogo: '/tenants/logo',
  update: (id: string) => `/tenants/${id}`,
  remove: (id: string) => `/tenants/${id}`,
  status: (id: string) => `/tenants/${id}/status`,
  /** The caller's own tenant — for Tenant Admins/Employees, not Super Admins. */
  mine: '/tenants/me',
  updateEmployeeIdPrefix: '/tenants/me/employee-id-prefix',
} as const;
