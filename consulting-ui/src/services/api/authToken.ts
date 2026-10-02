import { readStorage, removeStorage, writeStorage } from '@/utils/storage';

const REFRESH_TOKEN_KEY = 'refresh-token';

// Access tokens live in memory only (module-scoped, not React state) so the
// axios interceptor can read/write them synchronously without ever touching
// localStorage/sessionStorage.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return readStorage<string | null>(REFRESH_TOKEN_KEY, null);
}

export function setRefreshToken(token: string): void {
  writeStorage(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  accessToken = null;
  removeStorage(REFRESH_TOKEN_KEY);
}
