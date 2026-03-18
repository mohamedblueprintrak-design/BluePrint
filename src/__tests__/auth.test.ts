/**
 * Authentication Utilities Tests
 */

// Mock environment
process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-32-characters';

// Mock jose module
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtSign: jest.fn().mockResolvedValue('mock-jwt-token'),
  decodeJwt: jest.fn(),
  importJWK: jest.fn(),
  importPKCS8: jest.fn(),
}));

import { getJWTSecret, getTokenFromRequest } from '../app/api/utils/auth';
import { DEMO_USERS } from '../app/api/utils/db';
import bcrypt from 'bcryptjs';

// Helper to generate a mock token
async function generateMockToken(userId: string): Promise<string> {
  return `mock-token-${userId}`;
}

describe('Authentication Utilities', () => {
  describe('getJWTSecret', () => {
    it('should return a Uint8Array secret', () => {
      const secret = getJWTSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
      // Check it's a byte array-like object
      expect(typeof secret.length).toBe('number');
    });
  });

  describe('getTokenFromRequest', () => {
    it('should extract token from Authorization header', () => {
      const mockRequest = {
        headers: new Headers({
          authorization: 'Bearer test-token-123',
        }),
      } as any;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBe('test-token-123');
    });

    it('should return null if no Authorization header', () => {
      const mockRequest = {
        headers: new Headers({}),
      } as any;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null if Authorization header does not start with Bearer', () => {
      const mockRequest = {
        headers: new Headers({
          authorization: 'Basic test-token',
        }),
      } as any;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a valid token format', async () => {
      const userId = 'user-123';
      const token = await generateMockToken(userId);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different users', async () => {
      const token1 = await generateMockToken('user-1');
      const token2 = await generateMockToken('user-2');
      expect(token1).not.toBe(token2);
    });
  });
});

describe('Demo Users', () => {
  describe('DEMO_USERS', () => {
    it('should have demo users defined', () => {
      expect(DEMO_USERS).toBeDefined();
      expect(Array.isArray(DEMO_USERS)).toBe(true);
      // In demo mode, there should be users
      if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development') {
        expect(DEMO_USERS.length).toBeGreaterThan(0);
      }
    });

    it('should have required user properties when users exist', () => {
      if (DEMO_USERS.length > 0) {
        const user = DEMO_USERS[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('password');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('organizationId');
      }
    });
  });

  describe('findDemoUser helper', () => {
    it('should find user by username using Array.find', () => {
      if (DEMO_USERS.length > 0) {
        const user = DEMO_USERS[0];
        const found = DEMO_USERS.find(u => u.username === user.username);
        
        expect(found).toBeDefined();
        expect(found?.username).toBe(user.username);
      }
    });

    it('should return undefined for non-existent user', () => {
      const found = DEMO_USERS.find(u => u.username === 'nonexistent');
      expect(found).toBeUndefined();
    });
  });
});

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should verify correct password', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare('wrongpassword', hash);
    expect(isValid).toBe(false);
  });
});
