import { apiClient } from '@/services/api/client';
import { authEndpoints } from '@/services/api/endpoints';
import { getRefreshToken, setAccessToken, setRefreshToken } from '@/services/api/authToken';
import type { AuthUser, LoginPayload, LoginResponse, Role, TokenPair } from '../types/auth.types';

export interface RoleDto {
  id: string;
  code: string;
  name: string;
}

export interface UserDto {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  tenant_id: string | null;
  roles: RoleDto[];
}

export interface TokenPairDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface LoginResponseDto extends TokenPairDto {
  user: UserDto;
}

export function toRole(dto: RoleDto): Role {
  return { id: dto.id, code: dto.code, name: dto.name };
}

export function toUser(dto: UserDto): AuthUser {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    isActive: dto.is_active,
    tenantId: dto.tenant_id,
    roles: dto.roles.map(toRole),
  };
}

export function toTokenPair(dto: TokenPairDto): TokenPair {
  return {
    accessToken: dto.access_token,
    refreshToken: dto.refresh_token,
    tokenType: dto.token_type,
    expiresIn: dto.expires_in,
    refreshExpiresIn: dto.refresh_expires_in,
  };
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponseDto>(authEndpoints.login, payload);
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return { ...toTokenPair(data), user: toUser(data.user) };
  },

  async logout(): Promise<void> {
    // The refresh token identifies which session to revoke server-side;
    // the caller clears local token state once this resolves (or fails).
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiClient.post(authEndpoints.logout, { refresh_token: refreshToken });
    }
  },

  async getCurrentUser(): Promise<AuthUser> {
    const { data } = await apiClient.get<UserDto>(authEndpoints.me);
    return toUser(data);
  },

  /** Exchanges the stored refresh token for a new token pair, without fetching the user. */
  async refreshSession(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const { data } = await apiClient.post<TokenPairDto>(authEndpoints.refresh, {
      refresh_token: refreshToken,
    });
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
  },
};
