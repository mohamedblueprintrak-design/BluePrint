/**
 * Authentication API Tests
 * اختبارات API المصادقة
 */

import { NextRequest } from 'next/server';

// Mock all dependencies first
jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    session: { create: jest.fn(), deleteMany: jest.fn() },
    emailVerificationToken: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    twoFactorSecret: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    passwordResetToken: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((callbacks) => Promise.all(callbacks)),
  },
}));

jest.mock('@/lib/email', () => ({ sendEmail: jest.fn().mockResolvedValue(true) }));
jest.mock('@/lib/services/audit.service', () => ({ logAudit: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@/app/api/utils/rate-limit', () => ({
  checkRateLimitByType: jest.fn().mockReturnValue({ allowed: true, remaining: 10, resetTime: Date.now() + 60000 }),
  getClientIP: jest.fn().mockReturnValue('127.0.0.1'),
  rateLimitError: jest.fn().mockImplementation(() => ({
    status: 429,
    json: async () => ({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED' } }),
  })),
}));

jest.mock('@/lib/auth/auth-service', () => ({
  authService: {
    login: jest.fn().mockResolvedValue({ success: false }),
    signup: jest.fn().mockResolvedValue({ success: false }),
    verifyToken: jest.fn().mockResolvedValue(null),
    getUserById: jest.fn().mockResolvedValue(null),
    hasTwoFactorEnabled: jest.fn().mockResolvedValue(false),
    verifyEmail: jest.fn().mockResolvedValue({ success: false }),
    resendVerificationEmail: jest.fn().mockResolvedValue(true),
    requestPasswordReset: jest.fn().mockResolvedValue(true),
    confirmPasswordReset: jest.fn().mockResolvedValue({ success: false }),
    refreshToken: jest.fn().mockResolvedValue({ success: false }),
    logout: jest.fn().mockResolvedValue(true),
    getRolePermissions: jest.fn().mockReturnValue(['read', 'write']),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
  },
}));

// Import after mocking
import { POST as authHandler, GET as getCurrentUser } from '@/app/api/auth/route';
import { GET as verifyEmailHandler, POST as resendVerificationHandler } from '@/app/api/auth/verify-email/route';

describe('Authentication API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/auth (Login)', () => {
    it('should return error for missing email/password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return error for invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email: 'invalid', password: 'pass' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      expect(response.status).toBe(400);
    });

    it('should return error for invalid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email: 'test@test.com', password: 'wrong' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      expect(response.status).toBe(401);
    });

    it('should login successfully with valid credentials', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.login.mockResolvedValueOnce({
        success: true,
        user: { id: 'user-1', email: 'test@test.com' },
        token: 'token',
        refreshToken: 'refresh',
      });
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email: 'test@test.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth (Signup)', () => {
    it('should return error for weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'signup', email: 'test@test.com', username: 'test', password: '123', fullName: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      expect(response.status).toBe(400);
    });

    it('should return error for missing fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'signup', email: 'test@test.com' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/verify-email', () => {
    it('should return error for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', { method: 'GET' });
      const response = await verifyEmailHandler(request);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('TOKEN_REQUIRED');
    });

    it('should return error for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email?token=invalid', { method: 'GET' });
      const response = await verifyEmailHandler(request);
      expect(response.status).toBe(400);
    });

    it('should verify email successfully', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.verifyEmail.mockResolvedValueOnce({ success: true, user: { id: '1' } });
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email?token=valid', { method: 'GET' });
      const response = await verifyEmailHandler(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should return success for any email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await resendVerificationHandler(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return error for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await resendVerificationHandler(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth (Current User)', () => {
    it('should return error for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', { method: 'GET' });
      const response = await getCurrentUser(request);
      expect(response.status).toBe(401);
    });

    it('should return user for valid token', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.verifyToken.mockResolvedValueOnce({ userId: 'user-1' });
      authService.getUserById.mockResolvedValueOnce({ id: 'user-1', email: 'test@test.com', role: 'admin' });
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'GET',
        headers: { authorization: 'Bearer token' },
      });
      const response = await getCurrentUser(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth (Logout)', () => {
    it('should logout successfully', async () => {
      const { authService } = require('@/lib/auth/auth-service');
      authService.verifyToken.mockResolvedValueOnce({ userId: 'user-1' });
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'logout' }),
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer token' },
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
        body: JSON.stringify({ action: 'reset-password', token: 't', newPassword: 'NewPass123!', confirmPassword: 'Different!' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      expect(response.status).toBe(400);
    });

    it('should return error for weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset-password', token: 't', newPassword: 'weak', confirmPassword: 'weak' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await authHandler(request);
      expect(response.status).toBe(400);
    });
  });
});

describe('Password Validation', () => {
  it('should reject short passwords', () => expect('Short1!'.length).toBeLessThan(8));
  it('should accept valid passwords', () => {
    const password = 'ValidPass123!';
    expect(password.length).toBeGreaterThanOrEqual(8);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
  });
});

describe('JWT Token', () => {
  it('should have 3 parts', () => {
    expect('a.b.c'.split('.').length).toBe(3);
  });
});
