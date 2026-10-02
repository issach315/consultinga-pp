import { createContext } from 'react';
import type { AuthUser, LoginPayload } from '../types/auth.types';

export interface AuthContextValue {
  user: AuthUser | undefined;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
