export const requirementEndpoints = {
  list: '/requirements',
  create: '/requirements',
  detail: (id: string) => `/requirements/${id}`,
  update: (id: string) => `/requirements/${id}`,
  remove: (id: string) => `/requirements/${id}`,
  assignees: '/requirements/assignees',
  candidates: '/candidates',
  submissions: (jobId: string) => `/requirements/${jobId}/submissions`,
  submissionDetail: (id: string) => `/submissions/${id}`,
  submissionStatus: (id: string) => `/submissions/${id}/status`,
} as const;
