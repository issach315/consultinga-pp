export const attendanceEndpoints = {
  list: '/attendance',
  detail: (id: string) => `/attendance/${id}`,
} as const;
