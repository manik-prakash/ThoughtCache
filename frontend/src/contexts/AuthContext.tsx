import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, tokenManager } from '../lib/httpClient';
import {getErrorMessage} from '../lib/utils';
import type { ApiUser, LoginCredentials, SignupData, AuthResponse } from '../lib/types';

export interface AuthError {
  message: string;
}

interface AuthContextType {
  user: ApiUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.get();
      if (token) {
        try {
          const userData = await api.get<ApiUser>('/auth/me');
          setUser(userData);
        } catch (error) {
          console.log(error);
          tokenManager.remove();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const data: SignupData = { email, password, displayName };
      const response = await api.post<AuthResponse>('/auth/signup', data);
      tokenManager.set(response.token);
      setUser(response.user);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: {
          message: getErrorMessage(error),
        },
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data: LoginCredentials = { email, password };
      const response = await api.post<AuthResponse>('/auth/login', data);
      tokenManager.set(response.token);
      setUser(response.user);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: {
          message: getErrorMessage(error),
        },
      };
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
    } finally {
      tokenManager.remove();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
