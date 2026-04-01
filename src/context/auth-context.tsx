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
  token: string | null; // Kept for backward compat - but not from localStorage
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

// SECURITY: Removed all localStorage keys - JWT is stored in httpOnly cookies only.
// User data is kept in React state (memory) only - no persistent client-side storage.
// This mitigates XSS attacks that could steal tokens from localStorage.
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // Refresh every 4 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  // Load auth state from server (httpOnly cookies are sent automatically)
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'GET',
          credentials: 'include', // Send httpOnly cookies
        });
        const result = await response.json();

        if (result.success && result.data) {
          // API returns { user: {...}, demoMode? } or flat user object
          const userData = result.data?.user || result.data;
          setUser(userData);

          if (userData.organization) {
            setOrganization(userData.organization);
          }

          // Set a truthy token marker so backward-compat checks (token !== null) still work.
          // The actual JWT is never exposed to JS — it lives in the httpOnly cookie.
          const hasSession = true;
          setToken(hasSession ? 'httpOnly' : null);
          tokenRef.current = hasSession ? 'httpOnly' : null;
        }
      } catch {
        // Session invalid or server error — user is not authenticated
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;

    // Refresh every 4 minutes to keep the httpOnly cookie alive
    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'refresh' }),
        });

        const result = await response.json();
        if (result.success) {
          // Token refreshed on server (httpOnly cookie updated automatically)
          // No client-side token storage needed
        } else {
          // Refresh failed — user may need to re-login.
          // Don't force logout here; let the next API call handle it via 401.
        }
      } catch {
        // Network error — don't logout, retry later
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (data: LoginForm): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      // Add timeout for login request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for httpOnly cookies
        body: JSON.stringify({ action: 'login', ...data }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success) {
        // Server sets httpOnly cookies — no client-side token storage
        setToken('httpOnly');
        tokenRef.current = 'httpOnly';

        // Fetch user data using the new session cookie
        const meResponse = await fetch('/api/auth', {
          method: 'GET',
          credentials: 'include',
        });
        const userResult = await meResponse.json();

        if (userResult.success) {
          // Extract user from response — API returns { user: {...}, demoMode? } or flat user
          const userData = userResult.data?.user || userResult.data;
          setUser(userData);

          // Set organization
          if (userData.organization) {
            setOrganization(userData.organization);
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
        credentials: 'include',
        body: JSON.stringify({
          action: 'register',
          username: data.username,
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          organizationName: data.organizationName,
          role: data.role,
          department: data.department,
        }),
        signal: controller.signal,
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
      // Call logout endpoint to invalidate session and clear httpOnly cookies on server
      await fetch('/api/auth', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // Server logout failed — still clear local state
    } finally {
      // Always clear in-memory state (no localStorage to clean up)
      setUser(null);
      setOrganization(null);
      setToken(null);
      tokenRef.current = null;
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // No localStorage — update is in-memory only
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        // Extract user from response — API returns { user: {...}, demoMode? } or flat user
        const userData = result.data?.user || result.data;
        setUser(userData);

        const orgData = userData.organization;
        if (orgData) {
          setOrganization(orgData);
        }
      }
    } catch {
      // Refresh failed silently
    }
  }, []);

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
    try {
      const response = await fetch('/api/auth/switch-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      });

      const result = await response.json();
      if (result.success) {
        await refreshUser();
      }
    } catch {
      // Failed silently
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        hasPermission,
        hasRole,
        switchOrganization,
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
