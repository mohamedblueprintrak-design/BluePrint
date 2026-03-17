'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ApiResponse, LoginForm, RegisterForm } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginForm) => Promise<ApiResponse>;
  register: (data: RegisterForm) => Promise<ApiResponse>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'bp_token';
const AUTH_USER_KEY = 'bp_user';

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Helper to delete cookie
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage or cookies (for GitHub OAuth)
  useEffect(() => {
    // First check localStorage
    let storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    let storedUser = localStorage.getItem(AUTH_USER_KEY);
    
    // If not in localStorage, check cookies (set by GitHub OAuth)
    if (!storedToken || !storedUser) {
      const cookieToken = getCookie(AUTH_TOKEN_KEY);
      const cookieUser = getCookie(AUTH_USER_KEY);
      
      if (cookieToken && cookieUser) {
        storedToken = cookieToken;
        storedUser = cookieUser;
        
        // Copy to localStorage for persistence
        localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
        localStorage.setItem(AUTH_USER_KEY, cookieUser);
        
        // Clear the cookies (we'll use localStorage from now on)
        deleteCookie(AUTH_TOKEN_KEY);
        deleteCookie(AUTH_USER_KEY);
      }
    }

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (_e) {
        // Invalid JSON, clear storage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const apiCall = async (action: string, data?: any, useToken?: string) => {
    const url = `/api?action=${action}`;
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...((useToken || token) ? { Authorization: `Bearer ${useToken || token}` } : {})
      },
      body: JSON.stringify(data)
    };
    const response = await fetch(url, options);
    return response.json();
  };

  const login = async (data: LoginForm): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      const result = await apiCall('login', data);
      if (result.success) {
        const newToken = result.data.accessToken;
        setToken(newToken);
        localStorage.setItem(AUTH_TOKEN_KEY, newToken);

        // Fetch user data
        const userResult = await apiCall('me', {}, newToken);
        if (userResult.success) {
          setUser(userResult.data);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userResult.data));
        }
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error: any) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: error.message } };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterForm): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      const result = await apiCall('register', {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName
      });
      return { success: result.success, error: result.error };
    } catch (error: any) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: error.message } };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const result = await apiCall('me', {});
      if (result.success) {
        setUser(result.data);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
        refreshUser
      }}
    >
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
