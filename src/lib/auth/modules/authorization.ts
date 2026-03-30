/**
 * Authorization Module
 * وحدة التحقق من الصلاحيات
 * 
 * Handles role-based access control (RBAC) and permission checks
 */

import { UserRole, Permission, ROLE_PERMISSIONS } from '../types';

// ============================================
// Role Hierarchy
// ============================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MANAGER]: 80,
  [UserRole.PROJECT_MANAGER]: 70,
  [UserRole.ENGINEER]: 50,
  [UserRole.DRAFTSMAN]: 45,
  [UserRole.ACCOUNTANT]: 50,
  [UserRole.HR]: 50,
  [UserRole.SECRETARY]: 40,
  [UserRole.VIEWER]: 25,
};

// ============================================
// Permission Checks
// ============================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// ============================================
// Role Checks
// ============================================

/**
 * Check if user role is at or above a certain level
 */
export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

/**
 * Check if user is manager or above
 */
export function isManagerOrAbove(userRole: UserRole): boolean {
  return isRoleAtLeast(userRole, UserRole.MANAGER);
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasAnyPermission(userRole, [
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
  ]);
}

/**
 * Check if user can manage projects
 */
export function canManageProjects(userRole: UserRole): boolean {
  return hasAnyPermission(userRole, [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
  ]);
}

/**
 * Check if user can approve items
 */
export function canApprove(userRole: UserRole): boolean {
  return isManagerOrAbove(userRole);
}

/**
 * Check if user can access financial data
 */
export function canAccessFinancials(userRole: UserRole): boolean {
  return hasAnyPermission(userRole, [
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.BUDGET_MANAGE,
  ]);
}

/**
 * Check if user can access HR data
 */
export function canAccessHR(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.MANAGER || userRole === UserRole.HR;
}

// ============================================
// Role Utilities
// ============================================

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get role level in hierarchy
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

/**
 * Get all roles below a certain level
 */
export function getRolesBelow(role: UserRole): UserRole[] {
  const level = ROLE_HIERARCHY[role] || 0;
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, rLevel]) => rLevel < level)
    .map(([r]) => r as UserRole);
}

/**
 * Get all roles at or above a certain level
 */
export function getRolesAtOrAbove(role: UserRole): UserRole[] {
  const level = ROLE_HIERARCHY[role] || 0;
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, rLevel]) => rLevel >= level)
    .map(([r]) => r as UserRole);
}

// ============================================
// Resource Access Control
// ============================================

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(
  userRole: UserRole,
  resourceType: string,
  action: 'read' | 'write' | 'delete',
  resourceOwnerId?: string,
  userId?: string
): boolean {
  // Admin can do everything
  if (isAdmin(userRole)) return true;
  
  // Check if user owns the resource
  if (resourceOwnerId && userId && resourceOwnerId === userId) {
    return true;
  }
  
  // Map resource types to permissions
  const permissionMap: Record<string, Record<string, Permission>> = {
    project: {
      read: Permission.PROJECT_READ,
      write: Permission.PROJECT_UPDATE,
      delete: Permission.PROJECT_DELETE,
    },
    client: {
      read: Permission.CLIENT_READ,
      write: Permission.CLIENT_UPDATE,
      delete: Permission.CLIENT_DELETE,
    },
    task: {
      read: Permission.TASK_READ,
      write: Permission.TASK_UPDATE,
      delete: Permission.TASK_DELETE,
    },
    invoice: {
      read: Permission.INVOICE_READ,
      write: Permission.INVOICE_UPDATE,
      delete: Permission.INVOICE_DELETE,
    },
    user: {
      read: Permission.USER_READ,
      write: Permission.USER_UPDATE,
      delete: Permission.USER_DELETE,
    },
    document: {
      read: Permission.DOCUMENT_READ,
      write: Permission.DOCUMENT_UPDATE,
      delete: Permission.DOCUMENT_DELETE,
    },
  };
  
  const resourcePermissions = permissionMap[resourceType.toLowerCase()];
  if (!resourcePermissions) return false;
  
  const requiredPermission = resourcePermissions[action];
  if (!requiredPermission) return false;
  
  return hasPermission(userRole, requiredPermission);
}

// ============================================
// Organization Access
// ============================================

/**
 * Check if user belongs to the same organization as a resource
 */
export function isSameOrganization(
  userOrgId: string | undefined,
  resourceOrgId: string | undefined
): boolean {
  if (!userOrgId || !resourceOrgId) return false;
  return userOrgId === resourceOrgId;
}

/**
 * Check if user can access organization data
 */
export function canAccessOrganization(
  userRole: UserRole,
  userOrgId: string | undefined,
  resourceOrgId: string | undefined
): boolean {
  // Must be in the same organization
  if (!isSameOrganization(userOrgId, resourceOrgId)) {
    return false;
  }
  
  // All roles can read their org data
  return true;
}
