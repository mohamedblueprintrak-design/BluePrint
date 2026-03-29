/**
 * Authentication Types
 * أنواع المصادقة والتفويض
 */

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  PROJECT_MANAGER = 'project_manager',
  ENGINEER = 'engineer',
  ACCOUNTANT = 'accountant',
  HR = 'hr',
  VIEWER = 'viewer',
}

/**
 * Permission definitions
 */
export enum Permission {
  // Project permissions
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  
  // Task permissions
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  
  // Client permissions
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  
  // Invoice permissions
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  
  // User management permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Settings permissions
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',
  
  // Reports permissions
  REPORTS_READ = 'reports:read',
  REPORTS_EXPORT = 'reports:export',
  
  // Budget permissions
  BUDGET_MANAGE = 'budget:manage',
  
  // Document permissions
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',
}

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  
  [UserRole.MANAGER]: [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.USER_READ,
    Permission.REPORTS_READ,
    Permission.REPORTS_EXPORT,
  ],

  [UserRole.PROJECT_MANAGER]: [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.CLIENT_READ,
    Permission.INVOICE_READ,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_CREATE,
    Permission.REPORTS_READ,
  ],

  [UserRole.ENGINEER]: [
    Permission.PROJECT_READ,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.CLIENT_READ,
    Permission.INVOICE_READ,
    Permission.REPORTS_READ,
  ],
  
  [UserRole.ACCOUNTANT]: [
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.REPORTS_READ,
    Permission.REPORTS_EXPORT,
    Permission.BUDGET_MANAGE,
  ],

  [UserRole.HR]: [
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.REPORTS_READ,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
  ],

  [UserRole.VIEWER]: [
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.CLIENT_READ,
    Permission.INVOICE_READ,
  ],
};

/**
 * JWT Token payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  organizationId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Login request data
 * Supports login with either email or username
 */
export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Signup request data
 */
export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
  organizationName?: string;
}

/**
 * User object in auth response
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  role: UserRole;
  avatar: string | null;
  organizationId: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  error?: string;
  code?: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password change request
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}
