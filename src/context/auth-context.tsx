'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, Organization, ApiResponse, LoginForm, RegisterForm, UserRole, Permission, ROLE_PERMISSIONS as CANONICAL_ROLE_PERMISSIONS } from '@/types';

// Legacy permission name mapping (backward compatibility with old-style permissions)
// Maps old names like 'manage_users' to new canonical Permission enum values
const LEGACY_PERMISSION_MAP: Record<string, Permission[]> = {
  manage_users: [Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE],
  manage_organization: [Permission.SETTINGS_UPDATE],
  manage_projects: [Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE, Permission.PROJECT_DELETE],
  view_projects: [Permission.PROJECT_READ],
  manage_clients: [Permission.CLIENT_CREATE, Permission.CLIENT_UPDATE, Permission.CLIENT_DELETE],
  view_clients: [Permission.CLIENT_READ],
  manage_invoices: [Permission.INVOICE_CREATE, Permission.INVOICE_UPDATE, Permission.INVOICE_DELETE],
  view_invoices: [Permission.INVOICE_READ],
  manage_contracts: [Permission.PROJECT_UPDATE],
  manage_tasks: [Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_DELETE],
  view_tasks: [Permission.TASK_READ],
  manage_hr: [Permission.USER_CREATE, Permission.USER_UPDATE],
  view_hr: [Permission.USER_READ],
  manage_inventory: [Permission.SETTINGS_UPDATE],
  view_inventory: [Permission.SETTINGS_READ],
  manage_settings: [Permission.SETTINGS_UPDATE],
  view_reports: [Permission.REPORTS_READ],
  manage_subscriptions: [Permission.SETTINGS_UPDATE],
  manage_ai: [Permission.REPORTS_READ],
  export_data: [Permission.REPORTS_EXPORT],
  manage_templates: [Permission.SETTINGS_UPDATE],
  manage_attendance: [Permission.USER_READ],
  manage_leaves: [Permission.USER_UPDATE],
  view_users: [Permission.USER_READ],
  use_ai: [Permission.REPORTS_READ],
};

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginForm) => Promise<ApiResponse>;
  register: (data: RegisterForm) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'bp_token'; // SECURITY NOTE: JWT stored in localStorage is vulnerable to XSS attacks.
// TODO: Migrate to httpOnly cookies set by the server to mitigate XSS token theft.
const AUTH_USER_KEY = 'bp_user';
const AUTH_ORG_KEY = 'bp_organization';
const TOKEN_EXPIRY_KEY = 'bp_token_expiry';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

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
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=strict;`;
}

// Decode JWT token to get expiry
function decodeToken(token: string): { exp?: number; userId?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Check if token is expired or about to expire
function isTokenExpiringSoon(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  return expiryTime - currentTime < TOKEN_REFRESH_THRESHOLD;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Use ref to always have current token value in intervals (fixes stale closure bug)
  const tokenRef = useRef<string | null>(null);

  // Load auth state from localStorage or cookies
  useEffect(() => {
    const loadAuthState = async () => {
      // First check localStorage
      let storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      let storedUser = localStorage.getItem(AUTH_USER_KEY);
      let storedOrg = localStorage.getItem(AUTH_ORG_KEY);

      // If not in localStorage, check cookies (for SSR/initial load)
      if (!storedToken || !storedUser) {
        const cookieToken = getCookie(AUTH_TOKEN_KEY);
        const cookieUser = getCookie(AUTH_USER_KEY);

        if (cookieToken && cookieUser) {
          storedToken = cookieToken;
          storedUser = cookieUser;

          // Copy to localStorage for persistence
          localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
          localStorage.setItem(AUTH_USER_KEY, cookieUser);

          // Clear the cookies
          deleteCookie(AUTH_TOKEN_KEY);
          deleteCookie(AUTH_USER_KEY);
        }
      }

      if (storedToken && storedUser) {
        // Check if token is expired
        if (isTokenExpiringSoon(storedToken)) {
          // Token is expired or about to expire, clear storage
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem(AUTH_ORG_KEY);
          setIsLoading(false);
          return;
        }

        setToken(storedToken);
        tokenRef.current = storedToken;
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Set organization if available
          if (parsedUser.organization) {
            setOrganization(parsedUser.organization);
          } else if (storedOrg) {
            setOrganization(JSON.parse(storedOrg));
          }
        } catch {
          // Invalid JSON, clear storage
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem(AUTH_ORG_KEY);
        }
      }
      setIsLoading(false);
    };

    loadAuthState();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(async () => {
      // Use tokenRef.current to get the latest token (fixes stale closure bug)
      const currentToken = tokenRef.current;
      if (!currentToken || isTokenExpiringSoon(currentToken)) {
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ action: 'refresh' })
          });

          const result = await response.json();
          if (result.success && result.data?.accessToken) {
            const newToken = result.data.accessToken;
            setToken(newToken);
            tokenRef.current = newToken;
            localStorage.setItem(AUTH_TOKEN_KEY, newToken);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Don't logout on refresh failure, let the next API call handle it
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [token]);

  const login = async (data: LoginForm): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      // Add timeout for login request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...data }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const result = await response.json();

      if (result.success) {
        const newToken = result.data.token;
        setToken(newToken);
        tokenRef.current = newToken;
        localStorage.setItem(AUTH_TOKEN_KEY, newToken);

        // Fetch user data
        const meResponse = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          }
        });
        const userResult = await meResponse.json();

        if (userResult.success) {
          const userData = userResult.data;
          setUser(userData);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

          // Set organization
          if (userData.organization) {
            setOrganization(userData.organization);
            localStorage.setItem(AUTH_ORG_KEY, JSON.stringify(userData.organization));
          }
        }
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Request timeout' : error.message)
        : 'Unknown error';
      return { success: false, error: { code: 'NETWORK_ERROR', message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterForm): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      // Add timeout for register request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: data.username,
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          organizationName: data.organizationName,
          role: data.role,
          department: data.department
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const result = await response.json();
      return { success: result.success, data: result.data, error: result.error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Request timeout' : error.message)
        : 'Unknown error';
      return { success: false, error: { code: 'NETWORK_ERROR', message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate session on server
      if (token) {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setOrganization(null);
      setToken(null);
      tokenRef.current = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_ORG_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  }, [token]);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        const userData = result.data;
        setUser(userData);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

        if (userData.organization) {
          setOrganization(userData.organization);
          localStorage.setItem(AUTH_ORG_KEY, JSON.stringify(userData.organization));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [token]);

  // Check if user has a specific permission (supports both canonical and legacy permission names)
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    const rolePermissions = (CANONICAL_ROLE_PERMISSIONS as Record<string, Permission[]>)[user.role] || [];
    
    // Check if it's a canonical permission (e.g., 'project:create')
    if (rolePermissions.includes(permission as Permission)) {
      return true;
    }
    
    // Check if it's a legacy permission name (e.g., 'manage_users')
    const legacyMappings = LEGACY_PERMISSION_MAP[permission];
    if (legacyMappings) {
      return legacyMappings.some(p => rolePermissions.includes(p));
    }
    
    return false;
  }, [user]);

  // Check if user has a specific role (or one of multiple roles)
  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  // Switch organization (for users with access to multiple organizations)
  const switchOrganization = useCallback(async (organizationId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/auth/switch-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ organizationId })
      });
      
      const result = await response.json();
      if (result.success) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  }, [token, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        hasPermission,
        hasRole,
        switchOrganization
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

// Export permission helper for use outside components
// Returns canonical Permission enum values for the given role
export function getRolePermissions(role: UserRole): string[] {
  return (CANONICAL_ROLE_PERMISSIONS[role] || []).map(p => p as string);
}
