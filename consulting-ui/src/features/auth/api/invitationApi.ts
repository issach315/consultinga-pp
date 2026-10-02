import { apiClient } from '@/services/api/client';
import { invitationEndpoints } from '@/services/api/endpoints';
import { setAccessToken, setRefreshToken } from '@/services/api/authToken';
import { toTokenPair, toUser, type LoginResponseDto } from './authApi';
import type { InvitationDetail } from '../types/invitation.types';
import type { LoginResponse } from '../types/auth.types';

interface InvitationDetailDto {
  email: string;
  first_name: string;
  last_name: string;
  tenant_name: string;
  role_name: string;
  expires_at: string;
}

function toInvitationDetail(dto: InvitationDetailDto): InvitationDetail {
  return {
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    tenantName: dto.tenant_name,
    roleName: dto.role_name,
    expiresAt: dto.expires_at,
  };
}

export const invitationApi = {
  async getDetail(token: string): Promise<InvitationDetail> {
    const { data } = await apiClient.get<InvitationDetailDto>(invitationEndpoints.detail(token));
    return toInvitationDetail(data);
  },

  async accept(token: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponseDto>(invitationEndpoints.accept(token), {
      password,
    });
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return { ...toTokenPair(data), user: toUser(data.user) };
  },
};
