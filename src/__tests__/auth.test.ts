/**
 * Authentication Utilities Tests
 */

// Mock environment
process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-32-characters';

import * as jose from 'jose';
import { getJWTSecret, getTokenFromRequest, createToken } from '../app/api/utils/auth';
import { DEMO_USERS, findDemoUser } from '../app/api/utils/db';
import bcrypt from 'bcryptjs';

describe('Authentication Utilities', () => {
  describe('getJWTSecret', () => {
    it('should return a Uint8Array secret', () => {
      const secret = getJWTSecret();
      expect(secret).toBeInstanceOf(Uint8Array);
      expect(secret.length).toBeGreaterThan(0);
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

  describe('JWT Token Creation and Verification', () => {
    it('should create a valid JWT token', async () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'admin',
        organizationId: 'org-123',
      };

      const token = await createToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify a created token', async () => {
      const payload = {
        userId: 'user-456',
        username: 'testuser2',
        role: 'user',
        organizationId: 'org-456',
      };

      const token = await createToken(payload);
      const secret = getJWTSecret();
      
      const { payload: verified } = await jose.jwtVerify(token, secret);
      
      expect(verified.userId).toBe(payload.userId);
      expect(verified.username).toBe(payload.username);
      expect(verified.role).toBe(payload.role);
      expect(verified.organizationId).toBe(payload.organizationId);
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.token.here';
      const secret = getJWTSecret();
      
      await expect(jose.jwtVerify(invalidToken, secret)).rejects.toThrow();
    });
  });
});

describe('Demo Users', () => {
  describe('DEMO_USERS', () => {
    it('should have demo users defined', () => {
      expect(DEMO_USERS).toBeDefined();
      expect(Array.isArray(DEMO_USERS)).toBe(true);
      expect(DEMO_USERS.length).toBeGreaterThan(0);
    });

    it('should have required user properties', () => {
      const user = DEMO_USERS[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('organizationId');
    });
  });

  describe('findDemoUser', () => {
    it('should find user by username', () => {
      const user = DEMO_USERS[0];
      const found = findDemoUser(user.username);
      
      expect(found).toBeDefined();
      expect(found?.username).toBe(user.username);
    });

    it('should return undefined for non-existent user', () => {
      const found = findDemoUser('nonexistent');
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
