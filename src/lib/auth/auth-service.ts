/**
 * Authentication Service
 * خدمة المصادقة والتخويل
 * 
 * Implements JWT-based authentication with:
 * - Password hashing with bcrypt
 * - JWT token generation and validation
 * - Role-based access control (RBAC)
 * - Session management
 * - Password reset functionality
 */

import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  JwtPayload, 
  LoginRequest, 
  SignupRequest, 
  AuthResponse,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
} from './types';
import { logAudit } from '@/lib/services/audit.service';

// JWT Configuration
const JWT_ALG = 'HS256';
const JWT_ISSUER = 'blueprint-saas';
const JWT_AUDIENCE = 'blueprint-users';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';
const PASSWORD_RESET_EXPIRY = '1h';

/**
 * Authentication Service Class
 */
class AuthenticationService {
  
  // ============================================
  // Password Management
  // ============================================
  
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return hash(password, saltRounds);
  }
  
  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }
  
  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  // ============================================
  // JWT Token Management
  // ============================================
  
  /**
   * Get JWT secret key
   */
  private getJwtSecret(): Uint8Array {
    const secret = env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return new TextEncoder().encode(secret);
  }
  
  /**
   * Generate access token
   */
  async generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    const secret = this.getJwtSecret();
    
    return new SignJWT(payload as Record<string, unknown>)
      .setProtectedHeader({ alg: JWT_ALG })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(secret);
  }
  
  /**
   * Generate refresh token
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const secret = this.getJwtSecret();
    
    return new SignJWT({ userId, type: 'refresh' })
      .setProtectedHeader({ alg: JWT_ALG })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .sign(secret);
  }
  
  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(userId: string): Promise<string> {
    const secret = this.getJwtSecret();
    
    return new SignJWT({ userId, type: 'password-reset' })
      .setProtectedHeader({ alg: JWT_ALG })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime(PASSWORD_RESET_EXPIRY)
      .sign(secret);
  }
  
  /**
   * Verify and decode a JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const secret = this.getJwtSecret();
      const { payload } = await jwtVerify(token, secret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        username: payload.username as string,
        role: payload.role as UserRole,
        organizationId: payload.organizationId as string | undefined,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
    try {
      const secret = this.getJwtSecret();
      const { payload } = await jwtVerify(token, secret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      
      if (payload.type !== 'refresh') {
        return null;
      }
      
      return {
        userId: payload.userId as string,
      };
    } catch {
      return null;
    }
  }
  
  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<{ userId: string } | null> {
    try {
      const secret = this.getJwtSecret();
      const { payload } = await jwtVerify(token, secret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      
      if (payload.type !== 'password-reset') {
        return null;
      }
      
      return {
        userId: payload.userId as string,
      };
    } catch {
      return null;
    }
  }
  
  // ============================================
  // Authentication Operations
  // ============================================
  
  /**
   * Login user with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        };
      }
      
      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED',
        };
      }
      
      // Verify password
      if (!user.password) {
        return {
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        };
      }
      
      const isValidPassword = await this.verifyPassword(data.password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        };
      }
      
      // Generate tokens
      const accessToken = await this.generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role as UserRole,
        organizationId: user.organizationId || undefined,
      });
      
      const refreshToken = await this.generateRefreshToken(user.id);
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      
      // Log audit
      await logAudit({
        userId: user.id,
        organizationId: user.organizationId || undefined,
        entityType: 'user',
        entityId: user.id,
        action: 'login',
        description: `User logged in: ${user.email}`,
      });
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role as UserRole,
          avatar: user.avatar,
          organizationId: user.organizationId,
          organization: user.organization,
        },
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }
  
  /**
   * Register new user
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. '),
          code: 'WEAK_PASSWORD',
        };
      }
      
      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      
      if (existingEmail) {
        return {
          success: false,
          error: 'Email already registered',
          code: 'EMAIL_EXISTS',
        };
      }
      
      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username },
      });
      
      if (existingUsername) {
        return {
          success: false,
          error: 'Username already taken',
          code: 'USERNAME_EXISTS',
        };
      }
      
      // Hash password
      const hashedPassword = await this.hashPassword(data.password);
      
      // Create organization if name provided
      let organizationId: string | null = null;
      if (data.organizationName) {
        const org = await prisma.organization.create({
          data: {
            name: data.organizationName,
            slug: data.organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          },
        });
        organizationId = org.id;
      }
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username,
          password: hashedPassword,
          fullName: data.fullName,
          role: organizationId ? UserRole.ADMIN : UserRole.VIEWER,
          organizationId,
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
      
      // Generate tokens
      const accessToken = await this.generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role as UserRole,
        organizationId: user.organizationId || undefined,
      });
      
      const refreshToken = await this.generateRefreshToken(user.id);
      
      // Log audit
      await logAudit({
        userId: user.id,
        organizationId: user.organizationId || undefined,
        entityType: 'user',
        entityId: user.id,
        action: 'create',
        description: `New user registered: ${user.email}`,
      });
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role as UserRole,
          avatar: user.avatar,
          organizationId: user.organizationId,
          organization: user.organization,
        },
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      if (!payload) {
        return {
          success: false,
          error: 'Invalid refresh token',
          code: 'INVALID_TOKEN',
        };
      }
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or inactive',
          code: 'USER_NOT_FOUND',
        };
      }
      
      const accessToken = await this.generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role as UserRole,
        organizationId: user.organizationId || undefined,
      });
      
      const newRefreshToken = await this.generateRefreshToken(user.id);
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role as UserRole,
          avatar: user.avatar,
          organizationId: user.organizationId,
          organization: user.organization,
        },
        token: accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }
  
  /**
   * Change password
   */
  async changePassword(userId: string, data: PasswordChangeRequest): Promise<AuthResponse> {
    try {
      // Validate new password
      if (data.newPassword !== data.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
          code: 'PASSWORD_MISMATCH',
        };
      }
      
      const passwordValidation = this.validatePasswordStrength(data.newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. '),
          code: 'WEAK_PASSWORD',
        };
      }
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user || !user.password) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }
      
      // Verify current password
      const isValid = await this.verifyPassword(data.currentPassword, user.password);
      if (!isValid) {
        return {
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_PASSWORD',
        };
      }
      
      // Update password
      const hashedPassword = await this.hashPassword(data.newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      
      // Log audit
      await logAudit({
        userId,
        organizationId: user.organizationId || undefined,
        entityType: 'user',
        entityId: userId,
        action: 'update',
        description: 'Password changed',
      });
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }
  
  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      
      // Don't reveal if email exists or not
      if (!user) {
        return { success: true };
      }
      
      const resetToken = await this.generatePasswordResetToken(user.id);
      
      // In production, send email with reset link
      // await this.sendPasswordResetEmail(user.email, resetToken);
      
      // For now, return token (remove in production)
      console.log('Password reset token:', resetToken);
      
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: true }; // Don't reveal errors
    }
  }
  
  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<AuthResponse> {
    try {
      const payload = await this.verifyPasswordResetToken(data.token);
      if (!payload) {
        return {
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        };
      }
      
      if (data.newPassword !== data.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
          code: 'PASSWORD_MISMATCH',
        };
      }
      
      const passwordValidation = this.validatePasswordStrength(data.newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. '),
          code: 'WEAK_PASSWORD',
        };
      }
      
      const hashedPassword = await this.hashPassword(data.newPassword);
      
      await prisma.user.update({
        where: { id: payload.userId },
        data: { 
          password: hashedPassword,
          emailVerified: new Date(), // Verify email on password reset
        },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }
  
  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    // Log audit
    await logAudit({
      userId,
      entityType: 'user',
      entityId: userId,
      action: 'logout',
      description: 'User logged out',
    });
  }
  
  // ============================================
  // Authorization Methods
  // ============================================
  
  /**
   * Check if user has a specific permission
   */
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }
  
  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }
  
  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }
  
  /**
   * Check if user role is at or above a certain level
   */
  isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 100,
      [UserRole.MANAGER]: 75,
      [UserRole.ENGINEER]: 50,
      [UserRole.ACCOUNTANT]: 50,
      [UserRole.VIEWER]: 25,
    };
    
    return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
  }
  
  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }
  
  // ============================================
  // User Management
  // ============================================
  
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        avatar: true,
        language: true,
        theme: true,
        phone: true,
        jobTitle: true,
        department: true,
        organizationId: true,
        lastLoginAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
  
  /**
   * Validate user session
   */
  async validateSession(token: string): Promise<JwtPayload | null> {
    const payload = await this.verifyToken(token);
    if (!payload) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true },
    });
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return payload;
  }
}

// Export singleton instance
export const authService = new AuthenticationService();

// Export types and enums
export { UserRole, Permission, ROLE_PERMISSIONS };
export type { JwtPayload, LoginRequest, SignupRequest, AuthResponse };
