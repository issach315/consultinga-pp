import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types';
import { getTenantSubdomain } from '@/utils/tenantSubdomain';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './authToken';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  console.warn(
    'VITE_API_BASE_URL is not set. Configure it in your .env file before calling the API.',
  );
}

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bare axios instance (no interceptors) so the refresh call itself never
// recurses into the 401 handler below.
const refreshClient = axios.create({ baseURL, timeout: 15000 });

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function isAuthEndpoint(url: string | undefined): boolean {
  return Boolean(url && AUTH_PATHS.some((path) => url.includes(path)));
}

let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

// Single-flight refresh: concurrent 401s share one in-flight refresh
// request instead of each firing their own.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const { data } = await refreshClient.post<{
        access_token: string;
        refresh_token: string;
      }>('/auth/refresh', { refresh_token: refreshToken });

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      return data.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  const tenantSubdomain = getTenantSubdomain();
  if (tenantSubdomain) {
    config.headers.set('X-Tenant-Subdomain', tenantSubdomain);
  }
  return config;
});

interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string };
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorEnvelope>) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    const canAttemptRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !isAuthEndpoint(originalRequest.url) &&
      Boolean(getRefreshToken());

    if (canAttemptRefresh && originalRequest) {
      originalRequest._retried = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.set?.('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      } catch {
        clearTokens();
        onSessionExpired?.();
        return Promise.reject(
          new ApiError({ message: 'Your session has expired. Please sign in again.', status: 401 }),
        );
      }
    }

    if (status === 401 && !isAuthEndpoint(originalRequest?.url)) {
      clearTokens();
      onSessionExpired?.();
    }

    const message =
      error.response?.data?.error?.message ??
      (error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : error.message || 'An unexpected error occurred.');

    return Promise.reject(
      new ApiError({
        message,
        code: error.response?.data?.error?.code ?? error.code,
        status,
      }),
    );
  },
);
