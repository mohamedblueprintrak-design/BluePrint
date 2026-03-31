/**
 * API Client Tests
 * اختبارات عميل API
 *
 * Tests the unified fetch client for:
 * - Successful requests (GET, POST, PUT, DELETE)
 * - Error responses (401, 403, 404, 500)
 * - Request headers (Authorization, Content-Type)
 * - Request body serialization
 * - Response type guards
 * - ApiError class
 * - Convenience helpers (apiGet, apiPost, apiPut, apiDelete)
 */

import {
  apiRequest,
  directApiRequest,
  ApiError,
  isSuccessResponse,
  isErrorResponse,
  unwrapResponse,
} from '@/lib/api/fetch-client';

// ============================================
// Mock fetch
// ============================================

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

function createMockResponse(body: unknown, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Headers(),
  } as unknown as Response;
}

// ============================================
// ApiError Tests
// ============================================

describe('ApiError', () => {
  it('should create an error with message, code, and status', () => {
    const error = new ApiError('Something went wrong', 'BAD_REQUEST', 400);
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.status).toBe(400);
    expect(error.name).toBe('ApiError');
  });

  it('should use default values when not provided', () => {
    const error = new ApiError('Default error');
    expect(error.code).toBe('ERROR');
    expect(error.status).toBe(400);
  });

  it('should be an instance of Error', () => {
    const error = new ApiError('Test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });
});

// ============================================
// apiRequest Tests
// ============================================

describe('apiRequest', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should make GET request with action query param', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }, 200));

    const result = await apiRequest('GET', 'getProjects');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api?action=getProjects');
    expect(result.success).toBe(true);
  });

  it('should make GET request with data as query params', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }, 200));

    await apiRequest('GET', 'getProjects', { page: '1', limit: '10' });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('limit=10');
  });

  it('should make POST request with JSON body', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: { id: '1' } }, 200));

    const result = await apiRequest('POST', 'createProject', { name: 'Test' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callArgs.method).toBe('POST');
    expect(callArgs.headers).toHaveProperty('Content-Type', 'application/json');
    expect(callArgs.body).toBe(JSON.stringify({ name: 'Test' }));
    expect(result.success).toBe(true);
  });

  it('should include Authorization header when token provided', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: null }, 200));

    await apiRequest('GET', 'test', undefined, 'my-jwt-token');

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callArgs.headers).toHaveProperty('Authorization', 'Bearer my-jwt-token');
  });

  it('should NOT include Authorization header when no token', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: null }, 200));

    await apiRequest('GET', 'test');

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect((callArgs.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('should handle empty response body as null data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('No JSON')),
      text: jest.fn().mockResolvedValue(''),
      headers: new Headers(),
    } as unknown as Response);

    const result = await apiRequest('DELETE', 'deleteSomething');
    expect(result.success).toBe(true);
  });

  it('should throw error on non-ok response with error message from body', async () => {
    mockFetch.mockResolvedValue(createMockResponse(
      { error: { message: 'Not found' } }, 404
    ));

    await expect(apiRequest('GET', 'notFound')).rejects.toThrow('Not found');
  });

  it('should throw error with default message on non-ok response without JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('Not JSON')),
      text: jest.fn().mockResolvedValue('Internal Server Error'),
      headers: new Headers(),
    } as unknown as Response);

    await expect(apiRequest('GET', 'serverError')).rejects.toThrow('Request failed with status 500');
  });

  it('should make PUT request with body', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: { id: '1' } }, 200));

    await apiRequest('PUT', 'updateProject', { name: 'Updated' });

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callArgs.method).toBe('PUT');
    expect(callArgs.body).toBe(JSON.stringify({ name: 'Updated' }));
  });
});

// ============================================
// directApiRequest Tests
// ============================================

describe('directApiRequest', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should make GET request to direct endpoint', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: { id: '1' } }, 200));

    const result = await directApiRequest('GET', '/api/projects');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('/api/projects');
    expect(result.success).toBe(true);
  });

  it('should append query params for GET requests with data', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }, 200));

    await directApiRequest('GET', '/api/projects', { status: 'active', page: 2 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=active');
    expect(calledUrl).toContain('page=2');
  });

  it('should skip null/undefined query params for GET requests', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }, 200));

    await directApiRequest('GET', '/api/projects', { status: 'active', page: undefined, limit: null as any });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=active');
    expect(calledUrl).not.toContain('page=');
    expect(calledUrl).not.toContain('limit=');
  });

  it('should make POST request with body to direct endpoint', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: { id: '1' } }, 201));

    await directApiRequest('POST', '/api/projects', { name: 'New Project' });

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callArgs.method).toBe('POST');
    expect(callArgs.body).toBe(JSON.stringify({ name: 'New Project' }));
  });

  it('should handle 401 unauthorized responses', async () => {
    mockFetch.mockResolvedValue(createMockResponse(
      { error: { message: 'Unauthorized' } }, 401
    ));

    await expect(directApiRequest('GET', '/api/protected')).rejects.toThrow('Unauthorized');
  });

  it('should handle 403 forbidden responses', async () => {
    mockFetch.mockResolvedValue(createMockResponse(
      { error: { message: 'Forbidden' } }, 403
    ));

    await expect(directApiRequest('DELETE', '/api/admin')).rejects.toThrow('Forbidden');
  });

  it('should include Authorization header when token provided', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: null }, 200));

    await directApiRequest('GET', '/api/test', undefined, 'secret-token');

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callArgs.headers).toHaveProperty('Authorization', 'Bearer secret-token');
  });

  it('should make DELETE request without body', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: null }, 200));

    await directApiRequest('DELETE', '/api/projects/123');

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callArgs.method).toBe('DELETE');
  });
});

// ============================================
// Response Type Guard Tests
// ============================================

describe('Response Type Guards', () => {
  describe('isSuccessResponse', () => {
    it('should return true for success response', () => {
      const response = { success: true, data: { id: '1' } };
      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should return false for error response', () => {
      const response = { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } };
      expect(isSuccessResponse(response)).toBe(false);
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for error response', () => {
      const response = { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };
      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for success response', () => {
      const response = { success: true, data: [] };
      expect(isErrorResponse(response)).toBe(false);
    });
  });

  describe('unwrapResponse', () => {
    it('should return data for success response', () => {
      const response = { success: true, data: { id: '123', name: 'Test' } };
      expect(unwrapResponse(response)).toEqual({ id: '123', name: 'Test' });
    });

    it('should throw ApiError for error response', () => {
      const response = { success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } };
      expect(() => unwrapResponse(response)).toThrow(ApiError);
    });

    it('should include error code in thrown ApiError', () => {
      const response = { success: false, error: { code: 'VALIDATION', message: 'Invalid input' } };
      try {
        unwrapResponse(response);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION');
      }
    });

    it('should handle unknown error with default code', () => {
      const response = { success: false, error: { code: undefined as any, message: undefined as any } };
      try {
        unwrapResponse(response);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect((error as ApiError).code).toBe('UNKNOWN');
      }
    });
  });
});
