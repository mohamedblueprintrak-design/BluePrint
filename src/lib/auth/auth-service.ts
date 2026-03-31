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
 * - Email verification
 * - Two-factor authentication (2FA)
 */

import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { log } from '@/lib/logger';
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
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

// JWT Configuration
const JWT_ALG = 'HS256';
const JWT_ISSUER = 'blueprint-saas';
const JWT_AUDIENCE = 'blueprint-users';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';
const PASSWORD_RESET_EXPIRY = '1h';
const EMAIL_VERIFICATION_EXPIRY = '24h';
const TWO_FACTOR_CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

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
   * Login user with email or username and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email OR username
      let user;
      if (data.email) {
        user = await db.user.findUnique({
          where: { email: data.email.toLowerCase() },
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        });
      } else if (data.username) {
        user = await db.user.findUnique({
          where: { username: data.username },
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        });
      }
      
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
      await db.user.update({
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          organization: (user as any).organization,
        },
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      log.error('Login error', error);
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
      const existingEmail = await db.user.findUnique({
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
      const existingUsername = await db.user.findUnique({
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
        const org = await db.organization.create({
          data: {
            name: data.organizationName,
            slug: data.organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          },
        });
        organizationId = org.id;
      }
      
      // Create user
      const user = await db.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username,
          password: hashedPassword,
          fullName: data.fullName,
          role: (organizationId ? UserRole.ADMIN : (data.role && Object.values(UserRole).includes(data.role as UserRole) ? data.role : UserRole.VIEWER)) as any,
          department: data.department || null,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          organization: (user as any).organization,
        },
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      log.error('Signup error', error);
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
      
      const user = await db.user.findUnique({
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          organization: (user as any).organization,
        },
        token: accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      log.error('Token refresh error', error);
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
      const user = await db.user.findUnique({
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
      await db.user.update({
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
      log.error('Password change error', error);
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
      const user = await db.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      
      // Don't reveal if email exists or not
      if (!user) {
        return { success: true };
      }
      
      const resetToken = await this.generatePasswordResetToken(user.id);
      
      // Store token in database for invalidation after use
      await db.passwordResetToken.create({
        data: {
          email: user.email,
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Send password reset email with secure link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

      const template = emailTemplates.passwordReset(
        user.fullName || user.username,
        resetLink,
        60 // 1 hour expiry in minutes
      );

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }).catch(() => {
        // Email sending failed but don't reveal error to prevent enumeration
      });
      
      return { success: true };
    } catch (error) {
      log.error('Password reset request error', error);
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
      
      // Check if token has already been used
      const existingToken = await db.passwordResetToken.findUnique({
        where: { token: data.token },
      });
      if (existingToken?.usedAt) {
        return {
          success: false,
          error: 'Token already used',
          code: 'TOKEN_USED',
        };
      }

      const hashedPassword = await this.hashPassword(data.newPassword);
      
      await db.$transaction([
        db.user.update({
          where: { id: payload.userId },
          data: { 
            password: hashedPassword,
            emailVerified: new Date(), // Verify email on password reset
          },
        }),
        // Invalidate the token after successful password reset
        db.passwordResetToken.update({
          where: { token: data.token },
          data: { usedAt: new Date() },
        }),
      ]);
      
      return { success: true };
    } catch (error) {
      log.error('Password reset confirmation error', error);
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
      [UserRole.MANAGER]: 80,
      [UserRole.PROJECT_MANAGER]: 70,
      [UserRole.ENGINEER]: 50,
      [UserRole.DRAFTSMAN]: 45,
      [UserRole.ACCOUNTANT]: 50,
      [UserRole.HR]: 50,
      [UserRole.SECRETARY]: 40,
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
    return db.user.findUnique({
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
    
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true },
    });
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return payload;
  }

  // ============================================
  // Email Verification
  // ============================================

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(email: string, userId?: string): Promise<string> {
    // Delete any existing tokens for this email
    await db.emailVerificationToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.emailVerificationToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, userName: string, userId?: string): Promise<boolean> {
    try {
      const token = await this.generateEmailVerificationToken(email, userId);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationLink = `${appUrl}/verify-email?token=${token}`;

      const template = emailTemplates.emailVerification(userName, verificationLink, 24);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return true;
    } catch (error) {
      log.error('Failed to send verification email', error);
      return false;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const verificationToken = await db.emailVerificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return {
          success: false,
          error: 'Invalid verification token',
          code: 'INVALID_TOKEN',
        };
      }

      if (verificationToken.usedAt) {
        return {
          success: false,
          error: 'Token already used',
          code: 'TOKEN_USED',
        };
      }

      if (verificationToken.expiresAt < new Date()) {
        return {
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        };
      }

      // Find user by email
      const user = await db.user.findUnique({
        where: { email: verificationToken.email },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      // Mark email as verified
      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        }),
        db.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { usedAt: new Date() },
        }),
      ]);

      // Log audit
      await logAudit({
        userId: user.id,
        organizationId: user.organizationId || undefined,
        entityType: 'user',
        entityId: user.id,
        action: 'verify_email',
        description: `Email verified: ${user.email}`,
      });

      // Send confirmation email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const template = emailTemplates.emailVerified(user.fullName || user.username, `${appUrl}/login`);
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
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
        },
      };
    } catch (error) {
      log.error('Email verification error', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<AuthResponse> {
    try {
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Don't reveal if user exists
        return { success: true };
      }

      if (user.emailVerified) {
        return {
          success: false,
          error: 'Email already verified',
          code: 'ALREADY_VERIFIED',
        };
      }

      await this.sendVerificationEmail(user.email, user.fullName || user.username, user.id);

      return { success: true };
    } catch (error) {
      log.error('Resend verification error', error);
      return { success: true }; // Don't reveal errors
    }
  }

  // ============================================
  // Two-Factor Authentication (2FA)
  // ============================================

  /**
   * Generate 2FA secret for TOTP
   * Uses otplib for compatibility with Google Authenticator, Authy, etc.
   */
  async generateTwoFactorSecret(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    // Generate a proper Base32 secret compatible with authenticator apps
    const secret = generateSecret();
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create OTPAuth URL for QR code using otplib
    const appName = 'BluePrint';
    const qrCodeUrl = generateURI({
      issuer: appName,
      label: user.email,
      secret: secret,
    });

    // Store secret temporarily (will be activated after verification)
    const existingSecret = await db.twoFactorSecret.findUnique({
      where: { userId },
    });

    if (existingSecret) {
      await db.twoFactorSecret.update({
        where: { userId },
        data: { secret, isEnabled: false, verifiedAt: null },
      });
    } else {
      await db.twoFactorSecret.create({
        data: { userId, secret, backupCodes: '[]', isEnabled: false },
      });
    }

    return { secret, qrCodeUrl };
  }

  /**
   * Generate backup codes for 2FA
   */
  private generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = randomInt(10000000, 99999999).toString();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify TOTP code using otplib
   * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
   */
  private verifyTotpCode(secret: string, code: string): boolean {
    try {
      // Use otplib's verifySync for proper TOTP verification
      // It handles time window drift automatically
      const result = verifySync({
        secret: secret,
        token: code,
      });
      return result.valid;
    } catch (error) {
      log.error('TOTP verification error', error);
      return false;
    }
  }

  /**
   * Enable 2FA after verification
   */
  async enableTwoFactor(userId: string, verificationCode: string): Promise<AuthResponse & { backupCodes?: string[] }> {
    try {
      const twoFactorSecret = await db.twoFactorSecret.findUnique({
        where: { userId },
      });

      if (!twoFactorSecret || twoFactorSecret.isEnabled) {
        return {
          success: false,
          error: '2FA not set up or already enabled',
          code: 'INVALID_STATE',
        };
      }

      // Verify the code
      const isValid = this.verifyTotpCode(twoFactorSecret.secret, verificationCode);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid verification code',
          code: 'INVALID_CODE',
        };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Enable 2FA
      await db.twoFactorSecret.update({
        where: { userId },
        data: {
          isEnabled: true,
          verifiedAt: new Date(),
          backupCodes: JSON.stringify(backupCodes),
        },
      });

      // Get user for email
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true, username: true },
      });

      // Send confirmation email
      if (user) {
        const template = emailTemplates.twoFactorEnabled(user.fullName || user.username);
        await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      }

      // Log audit
      await logAudit({
        userId,
        entityType: 'user',
        entityId: userId,
        action: 'enable_2fa',
        description: 'Two-factor authentication enabled',
      });

      return {
        success: true,
        backupCodes,
      };
    } catch (error) {
      log.error('Enable 2FA error', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string, password: string): Promise<AuthResponse> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      // Verify password
      const isValid = await this.verifyPassword(password, user.password);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid password',
          code: 'INVALID_PASSWORD',
        };
      }

      // Disable 2FA
      await db.twoFactorSecret.deleteMany({
        where: { userId },
      });

      // Log audit
      await logAudit({
        userId,
        organizationId: user.organizationId || undefined,
        entityType: 'user',
        entityId: userId,
        action: 'disable_2fa',
        description: 'Two-factor authentication disabled',
      });

      return { success: true };
    } catch (error) {
      log.error('Disable 2FA error', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Verify 2FA code during login
   */
  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    try {
      const twoFactorSecret = await db.twoFactorSecret.findUnique({
        where: { userId },
      });

      if (!twoFactorSecret || !twoFactorSecret.isEnabled) {
        return false;
      }

      // Check if it's a backup code
      const backupCodes = (Array.isArray(twoFactorSecret.backupCodes)
        ? twoFactorSecret.backupCodes
        : JSON.parse(String(twoFactorSecret.backupCodes || '[]'))) as string[];
      const backupCodeIndex = backupCodes.indexOf(code);
      
      if (backupCodeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(backupCodeIndex, 1);
        await db.twoFactorSecret.update({
          where: { userId },
          data: { backupCodes: JSON.stringify(backupCodes) },
        });
        return true;
      }

      // Verify TOTP code
      return this.verifyTotpCode(twoFactorSecret.secret, code);
    } catch (error) {
      log.error('Verify 2FA error', error);
      return false;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async hasTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const twoFactorSecret = await db.twoFactorSecret.findUnique({
        where: { userId },
        select: { isEnabled: true },
      });
      return twoFactorSecret?.isEnabled || false;
    } catch {
      return false;
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string, password: string): Promise<AuthResponse & { backupCodes?: string[] }> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      // Verify password
      const isValid = await this.verifyPassword(password, user.password);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid password',
          code: 'INVALID_PASSWORD',
        };
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();

      await db.twoFactorSecret.update({
        where: { userId },
        data: { backupCodes: JSON.stringify(backupCodes) },
      });

      // Log audit
      await logAudit({
        userId,
        organizationId: user.organizationId || undefined,
        entityType: 'user',
        entityId: userId,
        action: 'regenerate_backup_codes',
        description: '2FA backup codes regenerated',
      });

      return {
        success: true,
        backupCodes,
      };
    } catch (error) {
      log.error('Regenerate backup codes error', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  // ============================================
  // Token Revocation / Session Invalidation
  // إلغاء الذاكرة المؤقتة / انتهاء صلاحية الجلسة
  // ============================================

  /**
   * Revoke a specific token (add to blacklist via sessions table)
   * Uses the sessions table to track revoked tokens
   */
  async revokeToken(userId: string, tokenJti?: string): Promise<void> {
    try {
      // Delete all sessions for the user (force re-login)
      await db.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      // Use the existing logger if available
      log.error('[AuthService] Failed to revoke token', error);
    }
  }

  /**
   * Revoke all user sessions except current one
   */
  async revokeOtherSessions(userId: string, currentToken: string): Promise<void> {
    try {
      await db.session.deleteMany({
        where: {
          userId,
          token: { not: currentToken },
        },
      });
    } catch (error) {
      log.error('[AuthService] Failed to revoke other sessions', error);
    }
  }

  /**
   * Check if a token/session is revoked
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const session = await db.session.findUnique({
        where: { token },
      });
      
      // If no session exists or it's expired, token is effectively revoked
      if (!session) return true;
      if (new Date(session.expiresAt) < new Date()) return true;
      
      return false;
    } catch {
      // If we can't verify, allow the request (fail open for availability)
      return false;
    }
  }

  /**
   * Invalidate all sessions for users of an organization
   * (useful after org-level settings changes)
   */
  async revokeOrganizationSessions(organizationId: string): Promise<void> {
    try {
      const userIds = await db.user.findMany({
        where: { organizationId },
        select: { id: true },
      });
      
      await db.session.deleteMany({
        where: {
          userId: { in: userIds.map(u => u.id) },
        },
      });
    } catch (error) {
      log.error('[AuthService] Failed to revoke org sessions', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthenticationService();

// Export types and enums
export { UserRole, Permission, ROLE_PERMISSIONS };
export type { JwtPayload, LoginRequest, SignupRequest, AuthResponse, PasswordChangeRequest, PasswordResetRequest, PasswordResetConfirm };
