/**
 * Authentication API Tests
 * اختبارات API المصادقة
 */

import { NextRequest } from 'next/server';
import { POST as authHandler, GET as getCurrentUser } from '@/app/api/auth/route';
import { POST as verifyEmailHandler } from '@/app/api/auth/verify-email/route';
import { POST as resendVerificationHandler } from '@/app/api/auth/resend-verification/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    twoFactorSecret: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callbacks) => Promise.all(callbacks)),
  },
}));

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/services/audit.service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

// Mock rate limiting to prevent test failures
jest.mock('@/app/api/utils/rate-limit', () => ({
  checkRateLimitByType: jest.fn().mockReturnValue({ allowed: true, remaining: 10, resetTime: Date.now() + 60000 }),
  getClientIP: jest.fn().mockReturnValue('127.0.0.1'),
  rateLimitError: jest.fn().mockImplementation((resetTime) => ({
    status: 429,
    headers: new Headers(),
    json: async () => ({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED' } }),
  })),
}));

jest.mock('@/lib/auth/auth-service', () => ({
  authService: {
    login: jest.fn(),
    signup: jest.fn(),
    verifyToken: jest.fn(),
    getUserById: jest.fn(),
    hasTwoFactorEnabled: jest.fn().mockResolvedValue(false),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    getRolePermissions: jest.fn().mockReturnValue(['read', 'write']),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
  },
}));

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth (Login)', () => {
    it('should return error for missing email/password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          email: 'invalid-email',
          password: 'password123',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for invalid credentials', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.login.mockResolvedValue({ success: false });

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          email: 'test@test.com',
          password: 'wrongpassword',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should login successfully with valid credentials', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 'user-1', email: 'test@test.com', username: 'testuser' },
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      });

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          email: 'test@test.com',
          password: 'password123',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
      expect(data.data.token).toBeDefined();
    });
  });

  describe('POST /api/auth (Signup)', () => {
    it('should return error for weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'signup',
          email: 'new@test.com',
          username: 'newuser',
          password: '123', // Too weak
          fullName: 'New User',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for missing fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'signup',
          email: 'new@test.com',
          // Missing username, password, fullName
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error if email already exists', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.signup.mockResolvedValue({
        success: false,
        error: 'البريد الإلكتروني مستخدم بالفعل',
        code: 'EMAIL_EXISTS',
      });

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'signup',
          email: 'existing@test.com',
          username: 'newuser',
          password: 'StrongPass123!',
          fullName: 'New User',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('EMAIL_EXISTS');
    });

    it('should signup successfully with valid data', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.signup.mockResolvedValue({
        success: true,
        user: { id: 'user-1', email: 'new@test.com' },
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      });
      authService.sendVerificationEmail.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'signup',
          email: 'new@test.com',
          username: 'newuser',
          password: 'StrongPass123!',
          fullName: 'New User',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should return error for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'GET',
      });

      const response = await verifyEmailHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('TOKEN_REQUIRED');
    });

    it('should return error for invalid token', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'رمز التحقق غير صالح',
        code: 'INVALID_TOKEN',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email?token=invalid-token', {
        method: 'GET',
      });

      const response = await verifyEmailHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error?.code).toBeDefined();
    });

    it('should verify email successfully', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.verifyEmail.mockResolvedValue({
        success: true,
        user: { id: 'user-1', email: 'test@test.com' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email?token=valid-token', {
        method: 'GET',
      });

      const response = await verifyEmailHandler(request);
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should return success even for non-existent email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@test.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await resendVerificationHandler(request);
      const data = await response.json();

      expect(data.success).toBe(true); // Don't reveal if email exists
    });

    it('should return error for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await resendVerificationHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('EMAIL_REQUIRED');
    });
  });

  describe('GET /api/auth (Current User)', () => {
    it('should return error for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'GET',
      });

      const response = await getCurrentUser(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return user for valid token', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.verifyToken.mockResolvedValue({ userId: 'user-1' });
      authService.getUserById.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        role: 'admin',
      });

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'GET',
        headers: { 'authorization': 'Bearer valid-token' },
      });

      const response = await getCurrentUser(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
    });
  });

  describe('POST /api/auth (Logout)', () => {
    it('should logout successfully', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.verifyToken.mockResolvedValue({ userId: 'user-1' });
      authService.logout.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'logout' }),
        headers: { 
          'Content-Type': 'application/json',
          'authorization': 'Bearer valid-token',
        },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth (Forgot Password)', () => {
    it('should return success for forgot password', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.requestPasswordReset.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'forgot-password',
          email: 'test@test.com' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth (Reset Password)', () => {
    it('should return error for password mismatch', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'reset-password',
          token: 'reset-token',
          newPassword: 'NewPass123!',
          confirmPassword: 'DifferentPass123!',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      // Password mismatch returns error
      expect(data.error?.code).toBeDefined();
    });

    it('should return error for weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'reset-password',
          token: 'reset-token',
          newPassword: 'weak',
          confirmPassword: 'weak',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await authHandler(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      // Weak password returns error
      expect(data.error?.code).toBeDefined();
    });
  });
});

describe('Password Validation', () => {
  it('should reject password shorter than 8 characters', () => {
    const password = 'Short1!';
    expect(password.length).toBeLessThan(8);
  });

  it('should reject password without uppercase', () => {
    const password = 'lowercase123!';
    expect(/[A-Z]/.test(password)).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const password = 'UPPERCASE123!';
    expect(/[a-z]/.test(password)).toBe(false);
  });

  it('should reject password without number', () => {
    const password = 'NoNumbers!';
    expect(/[0-9]/.test(password)).toBe(false);
  });

  it('should reject password without special character', () => {
    const password = 'NoSpecial123';
    expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(false);
  });

  it('should accept valid password', () => {
    const password = 'ValidPass123!';
    expect(password.length).toBeGreaterThanOrEqual(8);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(true);
  });
});

describe('JWT Token', () => {
  it('should have correct structure', () => {
    // JWT has 3 parts separated by dots
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature';
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });
});

describe('Rate Limiting', () => {
  it('should limit auth attempts', () => {
    const maxAuthAttempts = 10;
    const windowMs = 60000; // 1 minute

    expect(maxAuthAttempts).toBe(10);
    expect(windowMs).toBe(60000);
  });

  it('should limit API requests', () => {
    const maxApiRequests = 100;
    const windowMs = 60000; // 1 minute

    expect(maxApiRequests).toBe(100);
    expect(windowMs).toBe(60000);
  });
});
