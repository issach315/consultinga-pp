export const clientEndpoints = {
  list: '/clients',
  create: '/clients',
  detail: (clientId: string) => `/clients/${clientId}`,
  update: (clientId: string) => `/clients/${clientId}`,
  remove: (clientId: string) => `/clients/${clientId}`,
} as const;
