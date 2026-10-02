export interface Role {
  id: string;
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: string | null;
  roles: Role[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface LoginResponse extends TokenPair {
  user: AuthUser;
}
