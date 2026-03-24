/**
 * Tests for Environment Validation Utilities
 */

import {
  validateEnvironment,
  envValidators,
} from '@/lib/env-validator';

// Extract functions from envValidators
const { isValidHexKey } = envValidators;

// Mock process.env
const originalEnv = process.env;

describe('env-validator', () => {
  beforeEach(() => {
    // Reset process.env for each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ============================================
  // isValidHexKey Tests
  // ============================================

  describe('isValidHexKey', () => {
    it('should accept valid 64-character hex string', () => {
      const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      expect(isValidHexKey(validKey)).toBe(true);
    });

    it('should accept uppercase hex characters', () => {
      const validKey = '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF';
      expect(isValidHexKey(validKey)).toBe(true);
    });

    it('should reject keys shorter than 64 characters', () => {
      const shortKey = '0123456789abcdef';
      expect(isValidHexKey(shortKey)).toBe(false);
    });

    it('should reject keys longer than 64 characters', () => {
      const longKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef00';
      expect(isValidHexKey(longKey)).toBe(false);
    });

    it('should reject keys with non-hex characters', () => {
      const invalidKey = 'ghijklmnopqrstuv0123456789abcdef0123456789abcdef0123456789abcdef';
      expect(isValidHexKey(invalidKey)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidHexKey('')).toBe(false);
    });
  });

  // ============================================
  // validateEnvironment Tests
  // ============================================

  describe('validateEnvironment', () => {
    describe('development mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should pass with minimal development config', () => {
        const result = validateEnvironment();
        expect(result.valid).toBe(true);
      });

      it('should detect default development keys as info', () => {
        process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        process.env.JWT_SECRET = 'blueprint-saas-2024-secure-authentication-key-min-32-chars-valid';
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(true);
        expect(result.info.length).toBeGreaterThan(0);
      });
    });

    describe('production mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should fail without JWT_SECRET', () => {
        delete process.env.JWT_SECRET;
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('JWT_SECRET is required in production');
      });

      it('should fail with short JWT_SECRET', () => {
        process.env.JWT_SECRET = 'too-short';
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('32 characters'))).toBe(true);
      });

      it('should fail with placeholder JWT_SECRET', () => {
        process.env.JWT_SECRET = 'your_jwt_secret_change_this_minimum_32_chars';
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('placeholder'))).toBe(true);
      });

      it('should fail without ENCRYPTION_KEY', () => {
        delete process.env.ENCRYPTION_KEY;
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('ENCRYPTION_KEY is required in production');
      });

      it('should fail with invalid ENCRYPTION_KEY format', () => {
        process.env.ENCRYPTION_KEY = 'not-a-valid-hex-key';
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('64 hex characters'))).toBe(true);
      });

      it('should fail with placeholder ENCRYPTION_KEY', () => {
        process.env.ENCRYPTION_KEY = 'your_64_character_hex_encryption_key_for_sensitive_data';
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('placeholder'))).toBe(true);
      });

      it('should fail without DATABASE_URL', () => {
        delete process.env.DATABASE_URL;
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('DATABASE_URL is required in production');
      });

      it('should fail without NEXT_PUBLIC_APP_URL', () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('NEXT_PUBLIC_APP_URL is required in production');
      });

      it('should fail with localhost APP_URL in production', () => {
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('localhost'))).toBe(true);
      });

      it('should warn about non-HTTPS APP_URL', () => {
        process.env.NEXT_PUBLIC_APP_URL = 'http://example.com';
        
        const result = validateEnvironment();
        
        expect(result.warnings.some(w => w.includes('HTTPS'))).toBe(true);
      });

      it('should warn about missing Redis in production', () => {
        delete process.env.REDIS_PASSWORD;
        delete process.env.REDIS_URL;
        
        const result = validateEnvironment();
        
        expect(result.warnings.some(w => w.includes('Redis'))).toBe(true);
      });

      it('should warn about missing CORS configuration', () => {
        delete process.env.CORS_ORIGINS;
        delete process.env.ALLOWED_ORIGINS;
        
        const result = validateEnvironment();
        
        expect(result.warnings.some(w => w.includes('CORS'))).toBe(true);
      });

      it('should warn about Stripe test keys', () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
        
        const result = validateEnvironment();
        
        expect(result.warnings.some(w => w.includes('test keys'))).toBe(true);
      });

      it('should pass with valid production config', () => {
        process.env.JWT_SECRET = 'a-very-secure-production-jwt-secret-key-minimum-32-chars';
        process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/blueprint';
        process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
        
        const result = validateEnvironment();
        
        expect(result.valid).toBe(true);
      });
    });
  });
});
