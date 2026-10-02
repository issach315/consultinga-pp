export interface InvitationDetail {
  email: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  /** The invited user's role name, e.g. "Tenant Admin" or "Employee". */
  roleName: string;
  expiresAt: string;
}
