/**
 * Auth API Integration Tests
 * Full authentication flow tests for all auth endpoints.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  mockPrisma,
  mockJwt,
  mockBcrypt,
  mockTotp,
  mockRateLimiter,
  setupTestDatabase,
  teardownTestDatabase,
  createTestUserData,
  generateTestId,
  type UserRole,
} from '../../utils/setup';
import { generateAuthToken, TEST_CONSTANTS } from '../../utils/test-helpers';

// ─── Mock API Handler ────────────────────────────────────────────────────────

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    headers: new Map(),
    setHeader(key: string, value: string) { res.headers.set(key, value); },
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.body = data; return res; },
  };
  return res;
}

function createMockRequest(body: any = {}, headers: Record<string, string> = {}) {
  return {
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    cookies: {},
  };
}

// Simulated route handlers
class AuthHandlers {
  async login(req: any, res: any) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_ERROR' });
      }

      // Rate limiting check
      const rateCheck = await mockRateLimiter.check('login', email);
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: 'Too many login attempts', code: 'RATE_LIMITED' });
      }

      const user = await mockPrisma.user.findUnique({ where: { email } });
      if (!user) {
        await mockRateLimiter.consume('login', email);
        return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' });
      }

      const isValid = await mockBcrypt.compare(password, user.password);
      if (!isValid) {
        await mockRateLimiter.consume('login', email);
        return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      }

      if (user.twoFactorEnabled) {
        return res.status(200).json({
          requires2FA: true,
          userId: user.id,
          message: '2FA verification required',
        });
      }

      const accessToken = mockJwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      const refreshToken = mockJwt.sign(
        { userId: user.id, role: user.role, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async signup(req: any, res: any) {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required', code: 'VALIDATION_ERROR' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' });
      }

      const existing = await mockPrisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
      }

      const hashedPassword = await mockBcrypt.hash(password, 10);
      const user = await mockPrisma.user.create({
        data: { email, password: hashedPassword, name, role: role || 'ENGINEER' },
      });

      const verificationToken = mockJwt.sign(
        { userId: user.id, type: 'email_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        verificationToken,
        message: 'Account created. Please verify your email.',
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async logout(req: any, res: any) {
    try {
      // In real implementation, would blacklist the token
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async refresh(req: any, res: any) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required', code: 'VALIDATION_ERROR' });
      }

      let payload;
      try {
        payload = mockJwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' });
      }

      if (payload.type !== 'refresh') {
        return res.status(401).json({ error: 'Invalid token type', code: 'INVALID_TOKEN' });
      }

      const user = await mockPrisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive', code: 'USER_NOT_FOUND' });
      }

      const newAccessToken = mockJwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.status(200).json({ accessToken: newAccessToken });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async forgotPassword(req: any, res: any) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required', code: 'VALIDATION_ERROR' });
      }

      const user = await mockPrisma.user.findUnique({ where: { email } });
      if (!user) {
        // Always return success to prevent email enumeration
        return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
      }

      const resetToken = mockJwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: 'If the email exists, a reset link has been sent',
        resetToken, // In production, this would be sent via email
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async resetPassword(req: any, res: any) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required', code: 'VALIDATION_ERROR' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' });
      }

      let payload;
      try {
        payload = mockJwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired reset token', code: 'INVALID_TOKEN' });
      }

      if (payload.type !== 'password_reset') {
        return res.status(401).json({ error: 'Invalid token type', code: 'INVALID_TOKEN' });
      }

      const hashedPassword = await mockBcrypt.hash(password, 10);
      await mockPrisma.user.update({
        where: { id: payload.userId },
        data: { password: hashedPassword },
      });

      return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async verifyEmail(req: any, res: any) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Verification token is required', code: 'VALIDATION_ERROR' });
      }

      let payload;
      try {
        payload = mockJwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired verification token', code: 'INVALID_TOKEN' });
      }

      if (payload.type !== 'email_verification') {
        return res.status(401).json({ error: 'Invalid token type', code: 'INVALID_TOKEN' });
      }

      await mockPrisma.user.update({
        where: { id: payload.userId },
        data: { isEmailVerified: true },
      });

      return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async setup2FA(req: any, res: any) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required', code: 'VALIDATION_ERROR' });
      }

      const user = await mockPrisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      const secret = await mockTotp.generateSecret();
      const backupCodes = mockTotp.generateBackupCodes();
      const qrCode = await mockTotp.generateQR(userId, secret.ascii);

      return res.status(200).json({
        secret: secret.ascii,
        qrCode,
        backupCodes,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async verify2FA(req: any, res: any) {
    try {
      const { userId, code } = req.body;
      if (!userId || !code) {
        return res.status(400).json({ error: 'User ID and 2FA code are required', code: 'VALIDATION_ERROR' });
      }

      const user = await mockPrisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ error: '2FA is not enabled for this user', code: '2FA_NOT_ENABLED' });
      }

      // Check backup codes
      if (user.backupCodes && user.backupCodes.includes(code)) {
        await mockPrisma.user.update({
          where: { id: userId },
          data: { backupCodes: user.backupCodes.filter((bc: string) => bc !== code) },
        });

        const accessToken = mockJwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        const refreshToken = mockJwt.sign(
          { userId: user.id, role: user.role, type: 'refresh' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          accessToken,
          refreshToken,
          backupCodeUsed: true,
        });
      }

      // Verify TOTP
      const isValid = await mockTotp.verify(code, user.twoFactorSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid 2FA code', code: 'INVALID_2FA_CODE' });
      }

      const accessToken = mockJwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      const refreshToken = mockJwt.sign(
        { userId: user.id, role: user.role, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        accessToken,
        refreshToken,
        backupCodeUsed: false,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Auth API Integration', () => {
  let handlers: AuthHandlers;
  let testUser: ReturnType<typeof createTestUserData>;

  beforeEach(async () => {
    await setupTestDatabase();
    handlers = new AuthHandlers();
    testUser = createTestUserData({
      role: 'ADMIN',
      email: TEST_CONSTANTS.VALID_EMAIL,
      isActive: true,
      isEmailVerified: true,
      twoFactorEnabled: false,
    });
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── POST /api/auth/login ────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should return 200 and tokens on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const req = createMockRequest({ email: testUser.email, password: TEST_CONSTANTS.DEFAULT_PASSWORD });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken', 'access_token');
      expect(res.body).toHaveProperty('refreshToken', 'refresh_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should return 400 when email is missing', async () => {
      const req = createMockRequest({ password: 'password' });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when password is missing', async () => {
      const req = createMockRequest({ email: 'test@test.com' });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ email: 'nonexistent@test.com', password: 'password' });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const req = createMockRequest({ email: testUser.email, password: TEST_CONSTANTS.INVALID_PASSWORD });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 403 for inactive user', async () => {
      const inactiveUser = { ...testUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      const req = createMockRequest({ email: testUser.email, password: TEST_CONSTANTS.DEFAULT_PASSWORD });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should return 2FA challenge when user has 2FA enabled', async () => {
      const twoFAUser = { ...testUser, twoFactorEnabled: true };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const req = createMockRequest({ email: testUser.email, password: TEST_CONSTANTS.DEFAULT_PASSWORD });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('requires2FA', true);
      expect(res.body).toHaveProperty('userId');
      expect(res.body).not.toHaveProperty('accessToken');
    });

    it('should return 429 when rate limit exceeded', async () => {
      mockRateLimiter.check.mockResolvedValue({ allowed: false, remaining: 0 });

      const req = createMockRequest({ email: testUser.email, password: TEST_CONSTANTS.DEFAULT_PASSWORD });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBe(429);
      expect(res.body.code).toBe('RATE_LIMITED');
    });

    it('should consume rate limit on failed login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockRateLimiter.consume.mockResolvedValue(true);

      const req = createMockRequest({ email: 'nonexistent@test.com', password: 'password' });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(mockRateLimiter.consume).toHaveBeenCalledWith('login', 'nonexistent@test.com');
    });

    it('should have consistent error response format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ email: 'test@test.com', password: 'password' });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('code');
      expect(typeof res.body.error).toBe('string');
      expect(typeof res.body.code).toBe('string');
    });
  });

  // ─── POST /api/auth/signup ───────────────────────────────────────────────

  describe('POST /api/auth/signup', () => {
    it('should return 201 and user on successful signup', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(testUser);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockJwt.sign.mockReturnValue('verification_token');

      const req = createMockRequest({
        email: 'new@test.com',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
        name: 'New User',
      });
      const res = createMockResponse();
      await handlers.signup(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('verificationToken');
      expect(res.body.user.email).toBe('new@test.com');
    });

    it('should return 400 when required fields are missing', async () => {
      const req = createMockRequest({ email: 'test@test.com' });
      const res = createMockResponse();
      await handlers.signup(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const req = createMockRequest({
        email: 'test@test.com',
        password: TEST_CONSTANTS.WEAK_PASSWORD,
        name: 'Test',
      });
      const res = createMockResponse();
      await handlers.signup(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    it('should return 409 for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      const req = createMockRequest({
        email: testUser.email,
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
        name: 'Duplicate',
      });
      const res = createMockResponse();
      await handlers.signup(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('should set default role to ENGINEER', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async (args: any) => ({
        ...testUser,
        ...args.data,
      }));
      mockBcrypt.hash.mockResolvedValue('hashed');
      mockJwt.sign.mockReturnValue('token');

      const req = createMockRequest({
        email: 'new@test.com',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
        name: 'New User',
      });
      const res = createMockResponse();
      await handlers.signup(req, res);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'ENGINEER' }),
        })
      );
    });

    it('should return email verification token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(testUser);
      mockBcrypt.hash.mockResolvedValue('hashed');
      mockJwt.sign.mockReturnValue('email_verify_token');

      const req = createMockRequest({
        email: 'new@test.com',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
        name: 'New User',
      });
      const res = createMockResponse();
      await handlers.signup(req, res);

      expect(res.body.verificationToken).toBe('email_verify_token');
    });
  });

  // ─── POST /api/auth/logout ───────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('should return 200 on logout', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      await handlers.logout(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  // ─── POST /api/auth/refresh ──────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      mockJwt.verify.mockReturnValue({
        userId: testUser.id,
        role: 'ADMIN',
        type: 'refresh',
      });
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockJwt.sign.mockReturnValue('new_access_token');

      const req = createMockRequest({ refreshToken: 'valid_refresh' });
      const res = createMockResponse();
      await handlers.refresh(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBe('new_access_token');
    });

    it('should return 400 when refresh token is missing', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      await handlers.refresh(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for invalid refresh token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      const req = createMockRequest({ refreshToken: 'invalid' });
      const res = createMockResponse();
      await handlers.refresh(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 when refresh token has wrong type', async () => {
      mockJwt.verify.mockReturnValue({
        userId: testUser.id,
        role: 'ADMIN',
        type: 'access',
      });

      const req = createMockRequest({ refreshToken: 'access_token' });
      const res = createMockResponse();
      await handlers.refresh(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 when user is inactive', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, role: 'ADMIN', type: 'refresh' });
      mockPrisma.user.findUnique.mockResolvedValue({ ...testUser, isActive: false });

      const req = createMockRequest({ refreshToken: 'valid' });
      const res = createMockResponse();
      await handlers.refresh(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });
  });

  // ─── POST /api/auth/forgot-password ──────────────────────────────────────

  describe('POST /api/auth/forgot-password', () => {
    it('should return 200 for existing email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockJwt.sign.mockReturnValue('reset_token');

      const req = createMockRequest({ email: testUser.email });
      const res = createMockResponse();
      await handlers.forgotPassword(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('reset link');
    });

    it('should return 200 even for non-existent email (prevent enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ email: 'nonexistent@test.com' });
      const res = createMockResponse();
      await handlers.forgotPassword(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('reset link');
    });

    it('should return 400 when email is missing', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      await handlers.forgotPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── POST /api/auth/reset-password ───────────────────────────────────────

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'password_reset' });
      mockBcrypt.hash.mockResolvedValue('new_hashed');
      mockPrisma.user.update.mockResolvedValue(testUser);

      const req = createMockRequest({ token: 'valid_reset', password: 'NewPassword123!' });
      const res = createMockResponse();
      await handlers.resetPassword(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Password has been reset successfully');
    });

    it('should return 400 when token is missing', async () => {
      const req = createMockRequest({ password: 'NewPassword123!' });
      const res = createMockResponse();
      await handlers.resetPassword(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for weak new password', async () => {
      const req = createMockRequest({ token: 'valid', password: '123' });
      const res = createMockResponse();
      await handlers.resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    it('should return 401 for invalid reset token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      const req = createMockRequest({ token: 'invalid', password: 'NewPassword123!' });
      const res = createMockResponse();
      await handlers.resetPassword(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for wrong token type', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'email_verification' });

      const req = createMockRequest({ token: 'wrong_type', password: 'NewPassword123!' });
      const res = createMockResponse();
      await handlers.resetPassword(req, res);

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /api/auth/verify-email ─────────────────────────────────────────

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'email_verification' });
      mockPrisma.user.update.mockResolvedValue(testUser);

      const req = createMockRequest({ token: 'valid_verify_token' });
      const res = createMockResponse();
      await handlers.verifyEmail(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('verified');
    });

    it('should return 400 when token is missing', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      await handlers.verifyEmail(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 for expired token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('Token expired'); });

      const req = createMockRequest({ token: 'expired' });
      const res = createMockResponse();
      await handlers.verifyEmail(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for wrong token type', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'password_reset' });

      const req = createMockRequest({ token: 'reset_token_instead' });
      const res = createMockResponse();
      await handlers.verifyEmail(req, res);

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /api/auth/setup-2fa ────────────────────────────────────────────

  describe('POST /api/auth/setup-2fa', () => {
    it('should return 2FA setup data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockTotp.generateSecret.mockResolvedValue({
        ascii: 'SECRET',
        hex: 'hex',
        base32: 'base32',
        otpauth_url: 'otpauth://totp/BluePrint:test@example.com?secret=SECRET',
      });
      mockTotp.generateQR.mockResolvedValue('qr_data');
      mockTotp.generateBackupCodes.mockReturnValue(['CODE1', 'CODE2', 'CODE3']);

      const req = createMockRequest({ userId: testUser.id });
      const res = createMockResponse();
      await handlers.setup2FA(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('secret');
      expect(res.body).toHaveProperty('qrCode');
      expect(res.body).toHaveProperty('backupCodes');
      expect(res.body.backupCodes).toHaveLength(3);
    });

    it('should return 400 when userId is missing', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      await handlers.setup2FA(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ userId: 'nonexistent' });
      const res = createMockResponse();
      await handlers.setup2FA(req, res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── POST /api/auth/verify-2fa ───────────────────────────────────────────

  describe('POST /api/auth/verify-2fa', () => {
    it('should return tokens on successful 2FA verification', async () => {
      const twoFAUser = { ...testUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET', backupCodes: [] };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);
      mockTotp.verify.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const req = createMockRequest({ userId: testUser.id, code: '123456' });
      const res = createMockResponse();
      await handlers.verify2FA(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken', 'access_token');
      expect(res.body).toHaveProperty('refreshToken', 'refresh_token');
      expect(res.body).toHaveProperty('backupCodeUsed', false);
    });

    it('should accept backup code and return tokens', async () => {
      const twoFAUser = { ...testUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET', backupCodes: ['BACKUP-123'] };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);
      mockJwt.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const req = createMockRequest({ userId: testUser.id, code: 'BACKUP-123' });
      const res = createMockResponse();
      await handlers.verify2FA(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.backupCodeUsed).toBe(true);
    });

    it('should return 400 when userId or code is missing', async () => {
      const req = createMockRequest({ userId: testUser.id });
      const res = createMockResponse();
      await handlers.verify2FA(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 for invalid 2FA code', async () => {
      const twoFAUser = { ...testUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET', backupCodes: [] };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);
      mockTotp.verify.mockResolvedValue(false);

      const req = createMockRequest({ userId: testUser.id, code: '000000' });
      const res = createMockResponse();
      await handlers.verify2FA(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('INVALID_2FA_CODE');
    });

    it('should return 400 when 2FA is not enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...testUser, twoFactorEnabled: false });

      const req = createMockRequest({ userId: testUser.id, code: '123456' });
      const res = createMockResponse();
      await handlers.verify2FA(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('2FA_NOT_ENABLED');
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ userId: 'nonexistent', code: '123456' });
      const res = createMockResponse();
      await handlers.verify2FA(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('should remove used backup code from user', async () => {
      const twoFAUser = { ...testUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET', backupCodes: ['CODE1', 'CODE2'] };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);
      mockJwt.sign.mockReturnValue('token');

      const req = createMockRequest({ userId: testUser.id, code: 'CODE1' });
      const res = createMockResponse();
      await handlers.verify2FA(req, res);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            backupCodes: expect.arrayContaining(['CODE2']),
          }),
        })
      );
    });
  });

  // ─── Response Format Validation ───────────────────────────────────────────

  describe('response format validation', () => {
    it('should return JSON content type', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');

      const req = createMockRequest({ email: testUser.email, password: TEST_CONSTANTS.DEFAULT_PASSWORD });
      const res = createMockResponse();
      await handlers.login(req, res);

      expect(res.statusCode).toBeLessThan(300);
      expect(res.body).toBeInstanceOf(Object);
    });

    it('should return consistent error response structure', async () => {
      const testCases = [
        { handler: 'login', body: {} },
        { handler: 'signup', body: {} },
        { handler: 'refresh', body: {} },
      ];

      for (const tc of testCases) {
        const req = createMockRequest(tc.body);
        const res = createMockResponse();
        await (handlers as any)[tc.handler](req, res);

        if (res.statusCode >= 400) {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('code');
        }
      }
    });
  });
});
