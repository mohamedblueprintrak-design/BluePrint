/**
 * Authentication Utilities Tests
 * اختبارات أدوات المصادقة
 *
 * Tests critical auth paths:
 * - JWT secret generation
 * - Token extraction from requests
 * - Role-based access control (RBAC)
 * - Password validation and hashing
 * - Permission checking
 * - Authorization module
 */

// Mock environment before imports
process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-32-characters';
process.env.NODE_ENV = 'test';

import { getJWTSecret, getTokenFromRequest, isAdmin, isHR, isAccountant, canApproveLeave, canApproveExpense } from '@/app/api/utils/auth';
import { validatePasswordStrength, hashPassword, verifyPassword, generateSecurePassword } from '@/lib/auth/modules/password';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  isAdmin as authIsAdmin,
  isManagerOrAbove,
  canManageUsers,
  canManageProjects,
  canApprove,
  canAccessFinancials,
  canAccessHR,
  getRolePermissions,
  getRoleLevel,
  getRolesBelow,
  getRolesAtOrAbove,
  canAccessResource,
  isSameOrganization,
  canAccessOrganization,
} from '@/lib/auth/modules/authorization';
import { Permission, UserRoleValues } from '@/lib/auth/types';
import bcrypt from 'bcryptjs';

// ============================================
// Mock Request Helper
// ============================================

function createMockRequest(headers: Record<string, string> = {}) {
  return {
    headers: new Headers(headers),
  } as any;
}

// ============================================
// JWT Secret Tests
// ============================================

describe('getJWTSecret', () => {
  it('should return a Uint8Array-like object', () => {
    const secret = getJWTSecret();
    expect(secret).toBeDefined();
    expect(typeof secret.length).toBe('number');
    expect(secret.length).toBeGreaterThan(0);
    expect(typeof secret[0]).toBe('number');
  });

  it('should return a secret with positive length', () => {
    const secret = getJWTSecret();
    expect(secret.length).toBeGreaterThan(0);
  });

  it('should encode the configured JWT_SECRET value', () => {
    const secret = getJWTSecret();
    const expected = new TextEncoder().encode(process.env.JWT_SECRET);
    expect(secret).toEqual(expected);
  });
});

// ============================================
// Token Extraction Tests
// ============================================

describe('getTokenFromRequest', () => {
  it('should extract token from valid Bearer header', () => {
    const request = createMockRequest({ authorization: 'Bearer my-token-123' });
    expect(getTokenFromRequest(request)).toBe('my-token-123');
  });

  it('should return null when no authorization header exists', () => {
    const request = createMockRequest({});
    expect(getTokenFromRequest(request)).toBeNull();
  });

  it('should return null for non-Bearer schemes', () => {
    const request = createMockRequest({ authorization: 'Basic abc123' });
    expect(getTokenFromRequest(request)).toBeNull();
  });

  it('should handle Bearer header with only scheme (no token)', () => {
    // Headers implementation may strip trailing whitespace, so 'Bearer ' becomes 'Bearer'
    const request = createMockRequest({ authorization: 'Bearer' });
    expect(getTokenFromRequest(request)).toBeNull();
  });

  it('should handle case-sensitive Bearer prefix', () => {
    const request = createMockRequest({ authorization: 'bearer token-lowercase' });
    expect(getTokenFromRequest(request)).toBeNull();
  });
});

// ============================================
// API Auth Role Checks
// ============================================

describe('API Auth Role Checks', () => {
  const adminUser = { role: 'admin' } as any;
  const hrUser = { role: 'hr' } as any;
  const accountantUser = { role: 'accountant' } as any;
  const engineerUser = { role: 'engineer' } as any;

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      expect(isAdmin(hrUser)).toBe(false);
      expect(isAdmin(engineerUser)).toBe(false);
    });
  });

  describe('isHR', () => {
    it('should return true for hr role', () => {
      expect(isHR(hrUser)).toBe(true);
    });

    it('should return false for non-hr roles', () => {
      expect(isHR(adminUser)).toBe(false);
      expect(isHR(engineerUser)).toBe(false);
    });
  });

  describe('isAccountant', () => {
    it('should return true for accountant role', () => {
      expect(isAccountant(accountantUser)).toBe(true);
    });

    it('should return false for non-accountant roles', () => {
      expect(isAccountant(adminUser)).toBe(false);
      expect(isAccountant(hrUser)).toBe(false);
    });
  });

  describe('canApproveLeave', () => {
    it('should allow admin to approve leaves', () => {
      expect(canApproveLeave(adminUser)).toBe(true);
    });

    it('should allow HR to approve leaves', () => {
      expect(canApproveLeave(hrUser)).toBe(true);
    });

    it('should not allow engineer to approve leaves', () => {
      expect(canApproveLeave(engineerUser)).toBe(false);
    });
  });

  describe('canApproveExpense', () => {
    it('should allow admin to approve expenses', () => {
      expect(canApproveExpense(adminUser)).toBe(true);
    });

    it('should allow accountant to approve expenses', () => {
      expect(canApproveExpense(accountantUser)).toBe(true);
    });

    it('should not allow engineer to approve expenses', () => {
      expect(canApproveExpense(engineerUser)).toBe(false);
    });
  });
});

// ============================================
// Password Validation Tests
// ============================================

describe('Password Validation', () => {
  it('should validate a strong password', () => {
    const result = validatePasswordStrength('Test@1234');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject passwords shorter than 8 characters', () => {
    const result = validatePasswordStrength('Te@1');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('at least 8')])
    );
  });

  it('should reject passwords without uppercase', () => {
    const result = validatePasswordStrength('test@1234');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('uppercase')])
    );
  });

  it('should reject passwords without lowercase', () => {
    const result = validatePasswordStrength('TEST@1234');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('lowercase')])
    );
  });

  it('should reject passwords without numbers', () => {
    const result = validatePasswordStrength('Test@abcd');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('number')])
    );
  });

  it('should reject passwords without special characters', () => {
    const result = validatePasswordStrength('Test12345');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('special character')])
    );
  });

  it('should classify very-strong passwords (all checks + 12+ chars)', () => {
    const result = validatePasswordStrength('VeryStrong@Pass123');
    expect(result.strength).toBe('very-strong');
  });

  it('should classify strong passwords (all checks)', () => {
    const result = validatePasswordStrength('Strong@1');
    expect(result.strength).toBe('strong');
  });

  it('should classify medium passwords (4/5 checks)', () => {
    const result = validatePasswordStrength('Medium1234');
    expect(result.strength).toBe('medium');
  });
});

// ============================================
// Password Hashing (bcrypt)
// ============================================

describe('Password Hashing', () => {
  it('should hash password with bcrypt', async () => {
    const hash = await hashPassword('Test@1234');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('Test@1234');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should verify correct password against hash', async () => {
    const hash = await hashPassword('Test@1234');
    expect(await verifyPassword('Test@1234', hash)).toBe(true);
  });

  it('should reject incorrect password against hash', async () => {
    const hash = await hashPassword('Test@1234');
    expect(await verifyPassword('Wrong@1234', hash)).toBe(false);
  });

  it('should use bcrypt directly for compatibility', async () => {
    const password = 'Direct@1234';
    const hash = await bcrypt.hash(password, 10);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});

// ============================================
// Secure Password Generation
// ============================================

describe('generateSecurePassword', () => {
  it('should generate a password of default length 16', () => {
    const password = generateSecurePassword();
    expect(password).toBeDefined();
    expect(password.length).toBe(16);
  });

  it('should generate a password of custom length', () => {
    const password = generateSecurePassword(24);
    expect(password.length).toBe(24);
  });

  it('should include uppercase letters', () => {
    const password = generateSecurePassword();
    expect(/[A-Z]/.test(password)).toBe(true);
  });

  it('should include lowercase letters', () => {
    const password = generateSecurePassword();
    expect(/[a-z]/.test(password)).toBe(true);
  });

  it('should include numbers', () => {
    const password = generateSecurePassword();
    expect(/[0-9]/.test(password)).toBe(true);
  });

  it('should include special characters', () => {
    const password = generateSecurePassword();
    expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)).toBe(true);
  });

  it('should generate different passwords each call', () => {
    const passwords = new Set(Array.from({ length: 5 }, () => generateSecurePassword()));
    expect(passwords.size).toBeGreaterThan(1);
  });
});

// ============================================
// Permission Checks (Authorization Module)
// ============================================

describe('Authorization Module', () => {
  describe('hasPermission', () => {
    it('admin should have all permissions', () => {
      expect(hasPermission('ADMIN' as any, Permission.PROJECT_CREATE)).toBe(true);
      expect(hasPermission('ADMIN' as any, Permission.USER_DELETE)).toBe(true);
      expect(hasPermission('ADMIN' as any, Permission.BUDGET_MANAGE)).toBe(true);
    });

    it('viewer should only have read permissions', () => {
      expect(hasPermission('VIEWER' as any, Permission.PROJECT_READ)).toBe(true);
      expect(hasPermission('VIEWER' as any, Permission.TASK_READ)).toBe(true);
      expect(hasPermission('VIEWER' as any, Permission.PROJECT_CREATE)).toBe(false);
      expect(hasPermission('VIEWER' as any, Permission.PROJECT_DELETE)).toBe(false);
    });

    it('engineer should have task and project read/write', () => {
      expect(hasPermission('ENGINEER' as any, Permission.TASK_CREATE)).toBe(true);
      expect(hasPermission('ENGINEER' as any, Permission.TASK_UPDATE)).toBe(true);
      expect(hasPermission('ENGINEER' as any, Permission.USER_CREATE)).toBe(false);
    });

    it('accountant should have invoice and budget permissions', () => {
      expect(hasPermission('ACCOUNTANT' as any, Permission.INVOICE_CREATE)).toBe(true);
      expect(hasPermission('ACCOUNTANT' as any, Permission.BUDGET_MANAGE)).toBe(true);
      expect(hasPermission('ACCOUNTANT' as any, Permission.PROJECT_CREATE)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one of the permissions', () => {
      expect(hasAnyPermission('ENGINEER' as any, [
        Permission.USER_DELETE,
        Permission.TASK_CREATE,
      ])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(hasAnyPermission('VIEWER' as any, [
        Permission.USER_CREATE,
        Permission.USER_DELETE,
        Permission.USER_UPDATE,
      ])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all specified permissions', () => {
      expect(hasAllPermissions('ADMIN' as any, [
        Permission.PROJECT_CREATE,
        Permission.PROJECT_DELETE,
        Permission.TASK_CREATE,
      ])).toBe(true);
    });

    it('should return false if user is missing even one permission', () => {
      expect(hasAllPermissions('ENGINEER' as any, [
        Permission.TASK_CREATE,
        Permission.TASK_DELETE,
        Permission.USER_DELETE,
      ])).toBe(false);
    });
  });

  describe('isRoleAtLeast', () => {
    it('admin should be above manager', () => {
      expect(isRoleAtLeast('ADMIN' as any, 'MANAGER' as any)).toBe(true);
    });

    it('manager should be above engineer', () => {
      expect(isRoleAtLeast('MANAGER' as any, 'ENGINEER' as any)).toBe(true);
    });

    it('engineer should NOT be above manager', () => {
      expect(isRoleAtLeast('ENGINEER' as any, 'MANAGER' as any)).toBe(false);
    });

    it('viewer should be the lowest role', () => {
      expect(isRoleAtLeast('VIEWER' as any, 'ENGINEER' as any)).toBe(false);
    });

    it('same role should be at least the same level', () => {
      expect(isRoleAtLeast('MANAGER' as any, 'MANAGER' as any)).toBe(true);
    });
  });

  describe('authIsAdmin', () => {
    it('should identify admin', () => {
      expect(authIsAdmin('ADMIN' as any)).toBe(true);
    });

    it('should reject non-admin', () => {
      expect(authIsAdmin('MANAGER' as any)).toBe(false);
    });
  });

  describe('isManagerOrAbove', () => {
    it('admin is manager or above', () => {
      expect(isManagerOrAbove('ADMIN' as any)).toBe(true);
    });

    it('manager is manager or above', () => {
      expect(isManagerOrAbove('MANAGER' as any)).toBe(true);
    });

    it('engineer is NOT manager or above', () => {
      expect(isManagerOrAbove('ENGINEER' as any)).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('admin can manage users', () => {
      expect(canManageUsers('ADMIN' as any)).toBe(true);
    });

    it('HR can manage users', () => {
      expect(canManageUsers('HR' as any)).toBe(true);
    });

    it('engineer cannot manage users', () => {
      expect(canManageUsers('ENGINEER' as any)).toBe(false);
    });
  });

  describe('canManageProjects', () => {
    it('admin can manage projects', () => {
      expect(canManageProjects('ADMIN' as any)).toBe(true);
    });

    it('project_manager can manage projects', () => {
      expect(canManageProjects('PROJECT_MANAGER' as any)).toBe(true);
    });

    it('viewer cannot manage projects', () => {
      expect(canManageProjects('VIEWER' as any)).toBe(false);
    });
  });

  describe('canApprove', () => {
    it('manager can approve', () => {
      expect(canApprove('MANAGER' as any)).toBe(true);
    });

    it('viewer cannot approve', () => {
      expect(canApprove('VIEWER' as any)).toBe(false);
    });
  });

  describe('canAccessFinancials', () => {
    it('accountant can access financials', () => {
      expect(canAccessFinancials('ACCOUNTANT' as any)).toBe(true);
    });

    it('manager can access financials', () => {
      expect(canAccessFinancials('MANAGER' as any)).toBe(true);
    });

    it('engineer cannot access financials', () => {
      expect(canAccessFinancials('ENGINEER' as any)).toBe(false);
    });
  });

  describe('canAccessHR', () => {
    it('admin can access HR', () => {
      expect(canAccessHR('ADMIN' as any)).toBe(true);
    });

    it('HR can access HR', () => {
      expect(canAccessHR('HR' as any)).toBe(true);
    });

    it('engineer cannot access HR', () => {
      expect(canAccessHR('ENGINEER' as any)).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for admin', () => {
      const perms = getRolePermissions('ADMIN' as any);
      expect(perms.length).toBe(Object.values(Permission).length);
    });

    it('should return a subset for viewer', () => {
      const perms = getRolePermissions('VIEWER' as any);
      expect(perms.length).toBeLessThan(Object.values(Permission).length);
      expect(perms).toContain(Permission.PROJECT_READ);
    });

    it('should return empty array for unknown role', () => {
      const perms = getRolePermissions('UNKNOWN_ROLE' as any);
      expect(perms).toEqual([]);
    });
  });

  describe('getRoleLevel', () => {
    it('admin has the highest level', () => {
      expect(getRoleLevel('ADMIN' as any)).toBe(100);
    });

    it('viewer has the lowest level', () => {
      expect(getRoleLevel('VIEWER' as any)).toBe(25);
    });

    it('unknown role returns 0', () => {
      expect(getRoleLevel('UNKNOWN' as any)).toBe(0);
    });
  });

  describe('getRolesBelow', () => {
    it('all roles are below admin', () => {
      const below = getRolesBelow('ADMIN' as any);
      expect(below.length).toBe(Object.keys(UserRoleValues).length - 1);
    });

    it('no roles are below viewer', () => {
      const below = getRolesBelow('VIEWER' as any);
      expect(below).toEqual([]);
    });
  });

  describe('getRolesAtOrAbove', () => {
    it('only admin is at or above admin level', () => {
      const above = getRolesAtOrAbove('ADMIN' as any);
      expect(above).toEqual(['ADMIN']);
    });
  });

  describe('canAccessResource', () => {
    it('admin can access any resource', () => {
      expect(canAccessResource('ADMIN' as any, 'project', 'delete')).toBe(true);
      expect(canAccessResource('ADMIN' as any, 'user', 'delete')).toBe(true);
    });

    it('user can access their own resource', () => {
      expect(canAccessResource('ENGINEER' as any, 'task', 'write', 'user-1', 'user-1')).toBe(true);
    });

    it('user can access their own resource but not others (unless has permission)', () => {
      // Engineer has TASK_UPDATE permission, so they can write tasks even if not the owner
      expect(canAccessResource('ENGINEER' as any, 'task', 'write', 'user-2', 'user-1')).toBe(true);
      // Engineer cannot delete projects (no PROJECT_DELETE permission)
      expect(canAccessResource('ENGINEER' as any, 'project', 'delete', 'user-2', 'user-1')).toBe(false);
    });

    it('unknown resource type returns false for non-admin', () => {
      expect(canAccessResource('ENGINEER' as any, 'unknown_type', 'read')).toBe(false);
    });
  });

  describe('isSameOrganization', () => {
    it('should return true for same org IDs', () => {
      expect(isSameOrganization('org-1', 'org-1')).toBe(true);
    });

    it('should return false for different org IDs', () => {
      expect(isSameOrganization('org-1', 'org-2')).toBe(false);
    });

    it('should return false for undefined IDs', () => {
      expect(isSameOrganization(undefined, 'org-1')).toBe(false);
      expect(isSameOrganization('org-1', undefined)).toBe(false);
    });
  });

  describe('canAccessOrganization', () => {
    it('should allow same org access', () => {
      expect(canAccessOrganization('ENGINEER' as any, 'org-1', 'org-1')).toBe(true);
    });

    it('should deny different org access', () => {
      expect(canAccessOrganization('ADMIN' as any, 'org-1', 'org-2')).toBe(false);
    });
  });
});
