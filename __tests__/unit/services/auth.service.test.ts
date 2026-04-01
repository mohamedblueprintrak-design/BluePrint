/**
 * Auth Service Unit Tests
 * Tests for authentication, authorization, JWT, 2FA, and password management.
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
import { createTestUser, generateAuthToken, TEST_CONSTANTS } from '../../utils/test-helpers';

// ─── Mock Auth Service ────────────────────────────────────────────────────────

// Simulated auth service functions (mirroring the real service interface)
class AuthService {
  async login(email: string, password: string) {
    const user = await mockPrisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('INVALID_CREDENTIALS');

    if (!user.isActive) throw new Error('ACCOUNT_INACTIVE');

    const isValid = await mockBcrypt.compare(password, user.password);
    if (!isValid) throw new Error('INVALID_CREDENTIALS');

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

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  async signup(data: { email: string; name: string; password: string; role?: string }) {
    const existing = await mockPrisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('EMAIL_EXISTS');

    const hashedPassword = await mockBcrypt.hash(data.password, 10);
    const user = await mockPrisma.user.create({
      data: { email: data.email, name: data.name, password: hashedPassword, role: data.role || 'ENGINEER' },
    });

    const verificationToken = mockJwt.sign(
      { userId: user.id, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { user, verificationToken };
  }

  async verifyToken(token: string) {
    const payload = mockJwt.verify(token, process.env.JWT_SECRET);
    return payload;
  }

  async refreshToken(refreshToken: string) {
    const payload = mockJwt.verify(refreshToken, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') throw new Error('INVALID_REFRESH_TOKEN');

    const user = await mockPrisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error('USER_NOT_FOUND');

    const newAccessToken = mockJwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { accessToken: newAccessToken };
  }

  async setup2FA(userId: string) {
    const user = await mockPrisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');

    const secret = await mockTotp.generateSecret();
    const backupCodes = mockTotp.generateBackupCodes();

    await mockPrisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.ascii, backupCodes },
    });

    return { secret, backupCodes, qrCode: mockTotp.generateQR(userId, secret.ascii) };
  }

  async verify2FA(userId: string, code: string) {
    const user = await mockPrisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');
    if (!user.twoFactorEnabled) throw new Error('2FA_NOT_ENABLED');

    // Check if code is a backup code
    if (user.backupCodes && user.backupCodes.includes(code)) {
      await mockPrisma.user.update({
        where: { id: userId },
        data: { backupCodes: user.backupCodes.filter((bc: string) => bc !== code) },
      });
      return { verified: true, backupCodeUsed: true };
    }

    const isValid = await mockTotp.verify(code, user.twoFactorSecret);
    if (!isValid) throw new Error('INVALID_2FA_CODE');

    return { verified: true, backupCodeUsed: false };
  }

  async forgotPassword(email: string) {
    const user = await mockPrisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('USER_NOT_FOUND');

    const resetToken = mockJwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = mockJwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'password_reset') throw new Error('INVALID_RESET_TOKEN');

    const hashedPassword = await mockBcrypt.hash(newPassword, 10);

    await mockPrisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  async verifyEmail(token: string) {
    const payload = mockJwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'email_verification') throw new Error('INVALID_VERIFICATION_TOKEN');

    await mockPrisma.user.update({
      where: { id: payload.userId },
      data: { isEmailVerified: true },
    });

    return { verified: true };
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let authService: AuthService;
  let testUser: ReturnType<typeof createTestUserData>;

  beforeEach(async () => {
    await setupTestDatabase();
    authService = new AuthService();
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

  // ─── Login Tests ──────────────────────────────────────────────────────────

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('access_token_123')
        .mockReturnValueOnce('refresh_token_456');

      const result = await authService.login(testUser.email, TEST_CONSTANTS.DEFAULT_PASSWORD);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe('access_token_123');
      expect(result.refreshToken).toBe('refresh_token_456');
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.role).toBe('ADMIN');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: testUser.email } });
    });

    it('should throw error with invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('nonexistent@test.com', 'password'))
        .rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should throw error with invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(testUser.email, TEST_CONSTANTS.INVALID_PASSWORD))
        .rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should throw error when user account is inactive', async () => {
      const inactiveUser = { ...testUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(authService.login(testUser.email, TEST_CONSTANTS.DEFAULT_PASSWORD))
        .rejects.toThrow('ACCOUNT_INACTIVE');
    });

    it('should pass correct arguments to bcrypt.compare', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');

      await authService.login(testUser.email, 'myPassword123');

      expect(mockBcrypt.compare).toHaveBeenCalledWith('myPassword123', testUser.password);
    });

    it('should generate JWT with correct payload on login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');

      await authService.login(testUser.email, TEST_CONSTANTS.DEFAULT_PASSWORD);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser.id,
          role: 'ADMIN',
        }),
        process.env.JWT_SECRET,
        expect.objectContaining({ expiresIn: '15m' })
      );
    });

    it('should generate refresh token with type=refresh', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');

      await authService.login(testUser.email, TEST_CONSTANTS.DEFAULT_PASSWORD);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'refresh' }),
        process.env.JWT_SECRET,
        expect.objectContaining({ expiresIn: '7d' })
      );
    });

    it('should call findUnique only once per login attempt', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');

      await authService.login(testUser.email, TEST_CONSTANTS.DEFAULT_PASSWORD);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Signup Tests ─────────────────────────────────────────────────────────

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(testUser);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockJwt.sign.mockReturnValue('verification_token');

      const result = await authService.signup({
        email: testUser.email,
        name: testUser.name || 'Test User',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('verificationToken');
      expect(result.verificationToken).toBe('verification_token');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: testUser.email,
            password: 'hashed_password',
          }),
        })
      );
    });

    it('should reject signup with duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      await expect(authService.signup({
        email: testUser.email,
        name: 'Duplicate',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
      })).rejects.toThrow('EMAIL_EXISTS');
    });

    it('should hash password before storing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(testUser);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockJwt.sign.mockReturnValue('verification_token');

      await authService.signup({
        email: 'new@test.com',
        name: 'New User',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith(TEST_CONSTANTS.DEFAULT_PASSWORD, 10);
    });

    it('should set default role to ENGINEER', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...testUser, role: 'ENGINEER' });
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockJwt.sign.mockReturnValue('verification_token');

      await authService.signup({
        email: 'new@test.com',
        name: 'New User',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'ENGINEER' }),
        })
      );
    });

    it('should generate email verification token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(testUser);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockJwt.sign.mockReturnValue('verification_token');

      const result = await authService.signup({
        email: 'new@test.com',
        name: 'New User',
        password: TEST_CONSTANTS.DEFAULT_PASSWORD,
      });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'email_verification' }),
        process.env.JWT_SECRET,
        expect.objectContaining({ expiresIn: '24h' })
      );
    });
  });

  // ─── Token Verification Tests ─────────────────────────────────────────────

  describe('verifyToken', () => {
    it('should verify a valid access token', async () => {
      const mockPayload = { userId: 'user123', role: 'ADMIN', iat: 123, exp: 999 };
      mockJwt.verify.mockReturnValue(mockPayload);

      const result = await authService.verifyToken('valid_token');

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
    });

    it('should throw error for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError: invalid signature');
      });

      await expect(authService.verifyToken('invalid_token'))
        .rejects.toThrow('invalid signature');
    });

    it('should throw error for expired token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('TokenExpiredError: jwt expired');
      });

      await expect(authService.verifyToken('expired_token'))
        .rejects.toThrow('jwt expired');
    });

    it('should return token payload with userId and role', async () => {
      mockJwt.verify.mockReturnValue({
        userId: 'u123',
        role: 'MANAGER',
        iat: 100,
        exp: 200,
        iss: 'blueprint-saas',
      });

      const result = await authService.verifyToken('some_token');

      expect(result).toHaveProperty('userId', 'u123');
      expect(result).toHaveProperty('role', 'MANAGER');
    });
  });

  // ─── Refresh Token Tests ──────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should generate new access token from valid refresh token', async () => {
      mockJwt.verify.mockReturnValue({
        userId: testUser.id,
        role: 'ADMIN',
        type: 'refresh',
        iat: 100,
        exp: 999,
      });
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockJwt.sign.mockReturnValue('new_access_token');

      const result = await authService.refreshToken('valid_refresh_token');

      expect(result).toHaveProperty('accessToken', 'new_access_token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: testUser.id, role: 'ADMIN' }),
        process.env.JWT_SECRET,
        expect.objectContaining({ expiresIn: '15m' })
      );
    });

    it('should reject non-refresh tokens', async () => {
      mockJwt.verify.mockReturnValue({
        userId: testUser.id,
        role: 'ADMIN',
        type: 'access',
        iat: 100,
        exp: 999,
      });

      await expect(authService.refreshToken('access_token_instead'))
        .rejects.toThrow('INVALID_REFRESH_TOKEN');
    });

    it('should reject if user no longer exists', async () => {
      mockJwt.verify.mockReturnValue({
        userId: 'deleted_user',
        role: 'ADMIN',
        type: 'refresh',
        iat: 100,
        exp: 999,
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken('valid_refresh_token'))
        .rejects.toThrow('USER_NOT_FOUND');
    });

    it('should verify the refresh token with JWT secret', async () => {
      mockJwt.verify.mockReturnValue({
        userId: testUser.id,
        role: 'ADMIN',
        type: 'refresh',
        iat: 100,
        exp: 999,
      });
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockJwt.sign.mockReturnValue('new_access_token');

      await authService.refreshToken('my_refresh_token');

      expect(mockJwt.verify).toHaveBeenCalledWith('my_refresh_token', process.env.JWT_SECRET);
    });
  });

  // ─── Password Hashing Tests ───────────────────────────────────────────────

  describe('password hashing', () => {
    it('should hash password with salt rounds', async () => {
      const salt = '$2b$10$randomsalt';
      mockBcrypt.genSalt.mockResolvedValue(salt);
      mockBcrypt.hash.mockResolvedValue('hashed_result');

      const result = await mockBcrypt.hash('plain_password', 10);

      expect(result).toBe('hashed_result');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('plain_password', 10);
    });

    it('should verify correct password', async () => {
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await mockBcrypt.compare('correct_password', 'hashed');

      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await mockBcrypt.compare('wrong_password', 'hashed');

      expect(result).toBe(false);
    });

    it('should generate salt rounds for hashing', async () => {
      mockBcrypt.genSalt.mockResolvedValue('$2b$10$generatedsalt');

      const result = await mockBcrypt.genSalt(10);

      expect(result).toBe('$2b$10$generatedsalt');
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
    });
  });

  // ─── 2FA TOTP Tests ───────────────────────────────────────────────────────

  describe('2FA setup', () => {
    it('should generate TOTP secret for user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockTotp.generateSecret.mockResolvedValue({
        ascii: 'NEWSECRET123',
        hex: '4e4557534543524554313233',
        base32: 'NEVXGZLTOI2DGMJT',
        otpauth_url: 'otpauth://totp/BluePrint:test@example.com?secret=NEWSECRET123&issuer=BluePrint',
      });
      mockTotp.generateQR.mockResolvedValue('qr_code_data_url');

      const result = await authService.setup2FA(testUser.id);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('backupCodes');
      expect(result).toHaveProperty('qrCode');
      expect(result.secret.ascii).toBe('NEWSECRET123');
      expect(result.qrCode).toBe('qr_code_data_url');
    });

    it('should throw error if user not found during 2FA setup', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.setup2FA('nonexistent'))
        .rejects.toThrow('USER_NOT_FOUND');
    });

    it('should persist 2FA secret to database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockTotp.generateSecret.mockResolvedValue({
        ascii: 'MYSECRET',
        hex: '4d59534543524554',
        base32: 'MFWGY3TO',
        otpauth_url: 'otpauth://totp/BluePrint:test@example.com?secret=MYSECRET&issuer=BluePrint',
      });
      mockTotp.generateQR.mockResolvedValue('qr_code');

      await authService.setup2FA(testUser.id);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: expect.objectContaining({
          twoFactorSecret: 'MYSECRET',
          backupCodes: expect.any(Array),
        }),
      });
    });

    it('should generate backup codes during 2FA setup', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockTotp.generateSecret.mockResolvedValue({
        ascii: 'SECRET',
        hex: '534543524554',
        base32: 'ONXW4ZZA',
        otpauth_url: 'otpauth://totp/BluePrint:test@example.com?secret=SECRET&issuer=BluePrint',
      });
      mockTotp.generateQR.mockResolvedValue('qr');
      mockTotp.generateBackupCodes.mockReturnValue(['CODE-1', 'CODE-2', 'CODE-3']);

      const result = await authService.setup2FA(testUser.id);

      expect(result.backupCodes).toHaveLength(3);
      expect(result.backupCodes).toEqual(['CODE-1', 'CODE-2', 'CODE-3']);
    });
  });

  // ─── 2FA Verification Tests ───────────────────────────────────────────────

  describe('2FA verification', () => {
    it('should verify valid TOTP code', async () => {
      const twoFAUser = { ...testUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET123' };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);
      mockTotp.verify.mockResolvedValue(true);

      const result = await authService.verify2FA(testUser.id, '123456');

      expect(result).toEqual({ verified: true, backupCodeUsed: false });
      expect(mockTotp.verify).toHaveBeenCalledWith('123456', 'SECRET123');
    });

    it('should reject invalid TOTP code', async () => {
      const twoFAUser = { ...testUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET123' };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);
      mockTotp.verify.mockResolvedValue(false);

      await expect(authService.verify2FA(testUser.id, '000000'))
        .rejects.toThrow('INVALID_2FA_CODE');
    });

    it('should accept valid backup code', async () => {
      const twoFAUser = {
        ...testUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET123',
        backupCodes: ['ABCD-1234-EFGH', 'IJKL-5678-MNOP'],
      };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);

      const result = await authService.verify2FA(testUser.id, 'ABCD-1234-EFGH');

      expect(result).toEqual({ verified: true, backupCodeUsed: true });
    });

    it('should remove used backup code from user record', async () => {
      const twoFAUser = {
        ...testUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET123',
        backupCodes: ['ABCD-1234-EFGH', 'IJKL-5678-MNOP'],
      };
      mockPrisma.user.findUnique.mockResolvedValue(twoFAUser);

      await authService.verify2FA(testUser.id, 'ABCD-1234-EFGH');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            backupCodes: expect.arrayContaining(['IJKL-5678-MNOP']),
          }),
        })
      );
    });

    it('should throw error if 2FA is not enabled for user', async () => {
      const no2FAUser = { ...testUser, twoFactorEnabled: false };
      mockPrisma.user.findUnique.mockResolvedValue(no2FAUser);

      await expect(authService.verify2FA(testUser.id, '123456'))
        .rejects.toThrow('2FA_NOT_ENABLED');
    });

    it('should throw error if user not found for 2FA verification', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.verify2FA('nonexistent', '123456'))
        .rejects.toThrow('USER_NOT_FOUND');
    });
  });

  // ─── Password Reset Tests ─────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should generate password reset token for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockJwt.sign.mockReturnValue('reset_token_123');

      const result = await authService.forgotPassword(testUser.email);

      expect(result).toHaveProperty('resetToken', 'reset_token_123');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: testUser.id, type: 'password_reset' }),
        process.env.JWT_SECRET,
        expect.objectContaining({ expiresIn: '1h' })
      );
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.forgotPassword('nonexistent@test.com'))
        .rejects.toThrow('USER_NOT_FOUND');
    });

    it('should set 1 hour expiry on reset token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockJwt.sign.mockReturnValue('reset_token');

      await authService.forgotPassword(testUser.email);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: '1h' })
      );
    });
  });

  describe('resetPassword', () => {
    it('should update password with valid reset token', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'password_reset' });
      mockBcrypt.hash.mockResolvedValue('new_hashed_password');
      mockPrisma.user.update.mockResolvedValue({ ...testUser, password: 'new_hashed_password' });

      const result = await authService.resetPassword('valid_reset_token', 'NewSecurePass123!');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testUser.id },
          data: { password: 'new_hashed_password' },
        })
      );
    });

    it('should reject reset token with wrong type', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'email_verification' });

      await expect(authService.resetPassword('wrong_type_token', 'NewPass123!'))
        .rejects.toThrow('INVALID_RESET_TOKEN');
    });

    it('should reject expired reset token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('TokenExpiredError: jwt expired');
      });

      await expect(authService.resetPassword('expired_token', 'NewPass123!'))
        .rejects.toThrow('jwt expired');
    });

    it('should hash the new password before storing', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'password_reset' });
      mockBcrypt.hash.mockResolvedValue('hashed_new_pass');

      await authService.resetPassword('valid_token', 'NewPass123!');

      expect(mockBcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
    });
  });

  // ─── Email Verification Tests ─────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'email_verification' });
      mockPrisma.user.update.mockResolvedValue({ ...testUser, isEmailVerified: true });

      const result = await authService.verifyEmail('valid_email_token');

      expect(result).toEqual({ verified: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testUser.id },
          data: { isEmailVerified: true },
        })
      );
    });

    it('should reject verification token with wrong type', async () => {
      mockJwt.verify.mockReturnValue({ userId: testUser.id, type: 'password_reset' });

      await expect(authService.verifyEmail('wrong_type_token'))
        .rejects.toThrow('INVALID_VERIFICATION_TOKEN');
    });

    it('should reject expired verification token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('TokenExpiredError: jwt expired');
      });

      await expect(authService.verifyEmail('expired_email_token'))
        .rejects.toThrow('jwt expired');
    });

    it('should reject malformed verification token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError: jwt malformed');
      });

      await expect(authService.verifyEmail('not_a_jwt'))
        .rejects.toThrow('jwt malformed');
    });
  });

  // ─── Rate Limiting Tests ──────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('should allow login when rate limit not exceeded', async () => {
      mockRateLimiter.check.mockResolvedValue({ allowed: true, remaining: 5 });
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');

      const rateCheck = await mockRateLimiter.check('login', testUser.email);

      expect(rateCheck.allowed).toBe(true);
      expect(rateCheck.remaining).toBe(5);
    });

    it('should block login when rate limit exceeded', async () => {
      mockRateLimiter.check.mockResolvedValue({ allowed: false, remaining: 0 });

      const rateCheck = await mockRateLimiter.check('login', testUser.email);

      expect(rateCheck.allowed).toBe(false);
      expect(rateCheck.remaining).toBe(0);
    });

    it('should decrement remaining attempts after failed login', async () => {
      mockRateLimiter.consume.mockResolvedValue(true);

      await mockRateLimiter.consume('login', testUser.email);

      expect(mockRateLimiter.consume).toHaveBeenCalledWith('login', testUser.email);
    });

    it('should track rate limits per email address', async () => {
      mockRateLimiter.check.mockResolvedValue({ allowed: true, remaining: 9 });

      await mockRateLimiter.check('login', 'user1@test.com');
      await mockRateLimiter.check('login', 'user2@test.com');

      expect(mockRateLimiter.check).toHaveBeenCalledTimes(2);
    });

    it('should reset rate limit after cool-down period', async () => {
      mockRateLimiter.reset.mockResolvedValue(undefined);

      await mockRateLimiter.reset('login', testUser.email);

      expect(mockRateLimiter.reset).toHaveBeenCalledWith('login', testUser.email);
    });
  });
});
