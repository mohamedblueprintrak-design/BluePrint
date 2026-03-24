/**
 * API Utility Functions Tests
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-32-characters';

// Helper to create mock request
function createMockRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  url?: string;
}): NextRequest {
  const headers = new Headers(options.headers || {});
  const url = options.url || 'http://localhost:3000/api/test';
  return {
    method: options.method || 'GET',
    headers,
    url,
    nextUrl: new URL(url),
    json: async () => options.body,
  } as unknown as NextRequest;
}

// Import modules
import { successResponse, errorResponse, unauthorizedResponse } from '../app/api/utils/response';
import { parsePaginationParams, buildPaginationMeta, calculateSkip } from '../app/api/utils/pagination';
import { checkRateLimit, getRateLimitConfig } from '../app/api/utils/rate-limit';

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should return a successful response with data', async () => {
      const data = { id: 1, name: 'Test' };
      const response = await successResponse(data);
      const json = await response.json();
      
      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
    });

    it('should include meta when provided', async () => {
      const data = [1, 2, 3];
      const meta = { total: 3, page: 1 };
      const response = await successResponse(data, meta);
      const json = await response.json();
      
      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
      expect(json.meta).toEqual(meta);
    });
  });

  describe('errorResponse', () => {
    it('should return an error response', async () => {
      const response = await errorResponse('Test error', 'TEST_ERROR', 400);
      const json = await response.json();
      
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('TEST_ERROR');
      expect(json.error.message).toBe('Test error');
      expect(response.status).toBe(400);
    });

    it('should use default values', async () => {
      const response = await errorResponse('Default error');
      const json = await response.json();
      
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('ERROR');
      expect(response.status).toBe(400);
    });
  });

  describe('unauthorizedResponse', () => {
    it('should return 401 unauthorized', async () => {
      const response = await unauthorizedResponse();
      const json = await response.json();
      
      expect(json.success).toBe(false);
      expect(response.status).toBe(401);
    });
  });
});

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should return default values when no params', () => {
      const searchParams = new URLSearchParams();
      const result = parsePaginationParams(searchParams);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.search).toBeUndefined();
    });

    it('should parse page and limit', () => {
      const searchParams = new URLSearchParams('page=2&limit=50');
      const result = parsePaginationParams(searchParams);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should cap limit at maximum', () => {
      const searchParams = new URLSearchParams('limit=200');
      const result = parsePaginationParams(searchParams);
      
      expect(result.limit).toBe(100); // MAX_LIMIT
    });

    it('should parse search query', () => {
      const searchParams = new URLSearchParams('search=test%20query');
      const result = parsePaginationParams(searchParams);
      
      expect(result.search).toBe('test query');
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct pagination metadata', () => {
      const meta = buildPaginationMeta(1, 20, 100);
      
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(20);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(false);
    });

    it('should handle last page correctly', () => {
      const meta = buildPaginationMeta(5, 20, 100);
      
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPrevPage).toBe(true);
    });
  });

  describe('calculateSkip', () => {
    it('should calculate correct skip value', () => {
      expect(calculateSkip(1, 20)).toBe(0);
      expect(calculateSkip(2, 20)).toBe(20);
      expect(calculateSkip(3, 50)).toBe(100);
    });
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
  });

  it('should allow requests within limit', () => {
    const mockRequest = createMockRequest({});
    const result = checkRateLimit(mockRequest);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should include rate limit headers info', () => {
    const mockRequest = createMockRequest({});
    const result = checkRateLimit(mockRequest);
    
    expect(result.remaining).toBeDefined();
    expect(result.resetTime).toBeDefined();
  });

  it('should return rate limit config', () => {
    const config = getRateLimitConfig();
    
    expect(config.maxRequests).toBeDefined();
    expect(config.windowMs).toBeDefined();
    expect(config.maxRequests).toBe(100);
    expect(config.windowMs).toBe(60000);
  });
});
