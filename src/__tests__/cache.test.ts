/**
 * Cache Service Tests
 */

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockRejectedValue(new Error('Redis not available in test')),
    on: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    multi: jest.fn(() => ({
      incr: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([1, -1]),
    })),
    scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    socket: {},
  })),
}));

import CacheService from '../lib/cache';

describe('CacheService', () => {
  // Clear module cache before each test
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Memory Cache Fallback', () => {
    it('should fallback to memory cache when Redis is unavailable', async () => {
      // Should work even without Redis
      const value = { test: 'data' };
      await CacheService.set('test-key', value, { ttl: 60 });
      const retrieved = await CacheService.get('test-key');
      
      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await CacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete cached values', async () => {
      await CacheService.set('delete-test', { data: 'test' }, { ttl: 60 });
      await CacheService.delete('delete-test');
      const result = await CacheService.get('delete-test');
      
      expect(result).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should check rate limit', async () => {
      const result = await CacheService.checkRateLimit('test-user', 10, 60);
      
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetTime');
      expect(result).toHaveProperty('total');
    });

    it('should allow first request', async () => {
      const result = await CacheService.checkRateLimit('new-user', 10, 60);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should increment counter on each check', async () => {
      const key = 'increment-test';
      
      const result1 = await CacheService.checkRateLimit(key, 100, 60);
      const result2 = await CacheService.checkRateLimit(key, 100, 60);
      
      expect(result2.total).toBeGreaterThan(result1.total);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedValue = { cached: true };
      await CacheService.set('cached-key', cachedValue, { ttl: 60 });
      
      const factory = jest.fn().mockResolvedValue({ cached: false });
      const result = await CacheService.getOrSet('cached-key', factory, { ttl: 60 });
      
      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache if not exists', async () => {
      const newValue = { new: true };
      const factory = jest.fn().mockResolvedValue(newValue);
      
      const result = await CacheService.getOrSet('new-factory-key', factory, { ttl: 60 });
      
      expect(result).toEqual(newValue);
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Prefix Support', () => {
    it('should use prefix for keys', async () => {
      const value = { prefixed: true };
      await CacheService.set('mykey', value, { prefix: 'test', ttl: 60 });
      
      // Should not find without prefix
      const noPrefix = await CacheService.get('mykey');
      expect(noPrefix).toBeNull();
      
      // Should find with prefix
      const withPrefix = await CacheService.get('mykey', { prefix: 'test' });
      expect(withPrefix).toEqual(value);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in rate limiting', async () => {
      // Even with errors, should return a valid result (fail open)
      const result = await CacheService.checkRateLimit('error-test', 10, 60);
      
      expect(result.allowed).toBe(true);
    });
  });
});
