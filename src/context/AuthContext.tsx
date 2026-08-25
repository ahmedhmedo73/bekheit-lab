import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, LoginCredentials, UserRole } from '../types/auth';
import { StorageService } from '../services/storage';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
  updateUserSession: (updates: Partial<AuthUser>) => void;
}

const DEMO_ACCOUNTS: Record<UserRole, AuthUser> = {
  ADMIN: {
    id: 'staff-01',
    name: 'Prof. Dr. Mohamed Bekheit',
    email: 'mohamed.bekheit@bekheitlab.com',
    role: 'ADMIN',
    roleTitle: 'Consultant Pathologist & Lab Administrator',
    department: 'Histopathology & Cytology',
    staffId: 'BKL-1001',
    licenseNumber: 'EMS-74192-PATH',
    shift: 'Morning (07:00 - 15:30)',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Restore session
    const saved = StorageService.getAuthSession();
    if (saved) {
      setUser(saved);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    // Simulate network latency for authentic clinical LIMS feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    const emailClean = credentials.email.trim().toLowerCase();
    const staffList = StorageService.getStaffData();
    const matchingStaff = staffList.find((s) => s.email.toLowerCase() === emailClean);

    if (matchingStaff) {
      if (matchingStaff.status === 'Suspended') {
        setError('Your laboratory staff account is suspended. Contact the Lab Director.');
        setIsLoading(false);
        return false;
      }

      const authUser: AuthUser = {
        id: matchingStaff.id,
        name: matchingStaff.name,
        email: matchingStaff.email,
        role: matchingStaff.role,
        roleTitle: matchingStaff.roleTitle,
        department: matchingStaff.department,
        staffId: matchingStaff.staffId,
        licenseNumber: matchingStaff.licenseNumber,
        shift: matchingStaff.shift,
        lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setUser(authUser);
      StorageService.saveAuthSession(authUser);
      setIsLoading(false);
      return true;
    }

    // Check if matching any demo account or allow standard fallback demo login
    if (emailClean.includes('admin') || credentials.password === 'bekheit2026' || emailClean === 'demo@bekheitlab.com' || emailClean === 'mohamed.bekheit@bekheitlab.com') {
      const demoUser = DEMO_ACCOUNTS.ADMIN;
      setUser(demoUser);
      StorageService.saveAuthSession(demoUser);
      setIsLoading(false);
      return true;
    }

    // Default friendly login check: if valid email format and password >= 4 chars, match or allow guest tech
    if (emailClean.includes('@') && credentials.password.length >= 4) {
      const genericUser: AuthUser = {
        id: 'staff-gen',
        name: credentials.email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: credentials.email,
        role: 'ADMIN',
        roleTitle: 'Laboratory Administrator',
        department: 'Administration',
        staffId: 'BKL-7700',
        licenseNumber: 'MLS-TEMP-2026',
        shift: 'Morning (07:00 - 15:30)',
        lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setUser(genericUser);
      StorageService.saveAuthSession(genericUser);
      setIsLoading(false);
      return true;
    }

    setError('Invalid laboratory staff credentials. Please check your medical email and password.');
    setIsLoading(false);
    return false;
  };

  const quickLogin = useCallback((role: UserRole) => {
    const account = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.ADMIN;
    const authUser = {
      ...account,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setUser(authUser);
    StorageService.saveAuthSession(authUser);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    StorageService.saveAuthSession(null);
  }, []);

  const updateUserSession = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      StorageService.saveAuthSession(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        quickLogin,
        logout,
        updateUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
