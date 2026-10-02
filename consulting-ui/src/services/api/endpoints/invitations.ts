export const invitationEndpoints = {
  detail: (token: string) => `/invitations/${token}`,
  accept: (token: string) => `/invitations/${token}/accept`,
} as const;
