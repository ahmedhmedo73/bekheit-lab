import { createContext } from 'react';
import type { AuthUser, LoginCredentials } from '../types/auth';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
