/**
 * Structured, hierarchical query keys for TanStack Query.
 * Invalidating a parent key (e.g. `queryKeys.employees.all`) cascades to
 * every descendant key (lists, details) that was built from it.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  access: {
    all: ['access'] as const,
    mine: () => [...queryKeys.access.all, 'me'] as const,
  },
  clients: {
    all: ['requirements', 'clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.clients.lists(), params] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },
  requirements: {
    all: ['requirements', 'jobs'] as const,
    lists: () => [...queryKeys.requirements.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.requirements.lists(), params] as const,
    details: () => [...queryKeys.requirements.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.requirements.details(), id] as const,
    assignees: (role: string) => [...queryKeys.requirements.all, 'assignees', role] as const,
    candidates: (params: unknown) => [...queryKeys.requirements.all, 'candidates', params] as const,
    submissions: (jobId: string, params: unknown) =>
      [...queryKeys.requirements.all, jobId, 'submissions', params] as const,
    submissionLists: (jobId: string) =>
      [...queryKeys.requirements.all, jobId, 'submissions'] as const,
    submissionDetail: (id: string) => [...queryKeys.requirements.all, 'submission', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.employees.lists(), params] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
  },
  recruitment: {
    all: ['recruitment'] as const,
    candidates: {
      all: ['recruitment', 'candidates'] as const,
      lists: () => [...queryKeys.recruitment.candidates.all, 'list'] as const,
      list: (params: unknown) => [...queryKeys.recruitment.candidates.lists(), params] as const,
      details: () => [...queryKeys.recruitment.candidates.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.recruitment.candidates.details(), id] as const,
    },
    interviews: {
      all: ['recruitment', 'interviews'] as const,
      lists: () => [...queryKeys.recruitment.interviews.all, 'list'] as const,
      list: (params: unknown) => [...queryKeys.recruitment.interviews.lists(), params] as const,
      details: () => [...queryKeys.recruitment.interviews.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.recruitment.interviews.details(), id] as const,
    },
  },
  attendance: {
    all: ['attendance'] as const,
    lists: () => [...queryKeys.attendance.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.attendance.lists(), params] as const,
    details: () => [...queryKeys.attendance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.attendance.details(), id] as const,
  },
  payroll: {
    all: ['payroll'] as const,
    lists: () => [...queryKeys.payroll.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.payroll.lists(), params] as const,
    details: () => [...queryKeys.payroll.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payroll.details(), id] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...queryKeys.tenants.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.tenants.lists(), params] as const,
    details: () => [...queryKeys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
    mine: () => [...queryKeys.tenants.all, 'mine'] as const,
  },
  tenantAdminEmployees: {
    all: ['tenantAdminEmployees'] as const,
    lists: () => [...queryKeys.tenantAdminEmployees.all, 'list'] as const,
    list: (params: unknown) => [...queryKeys.tenantAdminEmployees.lists(), params] as const,
    details: () => [...queryKeys.tenantAdminEmployees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenantAdminEmployees.details(), id] as const,
    summaries: () => [...queryKeys.tenantAdminEmployees.all, 'summary'] as const,
    summary: (tenantId: string) =>
      [...queryKeys.tenantAdminEmployees.summaries(), tenantId] as const,
  },
  invitations: {
    all: ['invitations'] as const,
    detail: (token: string) => [...queryKeys.invitations.all, 'detail', token] as const,
  },
};
