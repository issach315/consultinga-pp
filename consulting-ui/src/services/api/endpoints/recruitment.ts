export const recruitmentEndpoints = {
  candidates: {
    list: '/recruitment/candidates',
    detail: (id: string) => `/recruitment/candidates/${id}`,
  },
  interviews: {
    list: '/recruitment/interviews',
    detail: (id: string) => `/recruitment/interviews/${id}`,
  },
} as const;
