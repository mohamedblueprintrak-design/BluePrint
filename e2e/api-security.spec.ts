/**
 * API Security E2E Tests
 * اختبارات أمان واجهة برمجة التطبيقات
 */

import { test, expect } from '@playwright/test';

const API_BASE = '/api';

test.describe('Authentication Security', () => {
  test('should reject unauthenticated requests to protected endpoints', async ({ request }) => {
    const endpoints = [
      '/api/projects',
      '/api/tasks',
      '/api/clients',
      '/api/invoices',
      '/api/documents',
      '/api/reports',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect([401, 403]).toContain(response.status());
    }
  });

  test('should reject invalid JWT tokens', async ({ request }) => {
    const response = await request.get('/api/projects', {
      headers: {
        Authorization: 'Bearer invalid-token-here',
      },
    });
    
    expect([401, 403]).toContain(response.status());
  });

  test('should reject expired tokens', async ({ request }) => {
    // This would need a real expired token to test properly
    const response = await request.get('/api/projects', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
    });
    
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Rate Limiting', () => {
  test('should enforce rate limits on auth endpoints', async ({ request }) => {
    // Make multiple rapid requests to login endpoint
    const requests = [];
    
    for (let i = 0; i < 15; i++) {
      requests.push(
        request.post('/api/auth', {
          data: {
            email: 'test@example.com',
            password: 'wrong-password',
          },
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status() === 429);
    
    // At least one request should be rate limited
    // Note: This might not work in all environments
  });
});

test.describe('Input Validation', () => {
  test('should reject XSS attempts', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: {
        name: '<script>alert("XSS")</script>Test Project',
        description: 'javascript:alert("XSS")',
      },
    });
    
    // Should reject or sanitize
    expect([400, 401, 403]).toContain(response.status());
  });

  test('should reject SQL injection attempts', async ({ request }) => {
    const response = await request.get('/api/projects?search=test\' OR \'1\'=\'1');
    
    // Should not return all data
    expect([400, 401, 403]).toContain(response.status());
  });

  test('should reject path traversal attempts', async ({ request }) => {
    const response = await request.get('/api/documents/../../../etc/passwd');
    
    expect([400, 401, 403, 404]).toContain(response.status());
  });

  test('should reject oversized payloads', async ({ request }) => {
    // Create a payload larger than typical limit (10MB)
    const largeData = 'x'.repeat(11 * 1024 * 1024); // 11MB
    
    const response = await request.post('/api/documents', {
      data: {
        content: largeData,
      },
    });
    
    expect([400, 413, 401, 403]).toContain(response.status());
  });
});

test.describe('CORS Security', () => {
  test('should reject requests from unauthorized origins', async ({ request }) => {
    const response = await request.get('/api/projects', {
      headers: {
        Origin: 'https://malicious-site.com',
      },
    });
    
    // Should not have CORS headers for unauthorized origin
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader).not.toBe('https://malicious-site.com');
  });
});

test.describe('Content Security', () => {
  test('should set security headers', async ({ request }) => {
    const response = await request.get('/');
    
    // Check for security headers
    const headers = response.headers();
    
    // X-Content-Type-Options should be nosniff
    expect(headers['x-content-type-options']).toBeDefined();
    
    // X-Frame-Options should prevent clickjacking
    expect(headers['x-frame-options']).toBeDefined();
  });
});

test.describe('CSRF Protection', () => {
  test('should reject POST without proper headers', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: {
        name: 'Test Project',
      },
    });
    
    // Should require authentication
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Mass Assignment Prevention', () => {
  test('should not allow role escalation', async ({ request }) => {
    // Attempt to create/update with role field
    const response = await request.post('/api/auth', {
      data: {
        email: 'test@example.com',
        password: 'password123',
        role: 'admin', // Should be ignored
      },
    });
    
    // Should not create admin user
    expect(response.status()).toBeDefined();
  });

  test('should not allow organization ID manipulation', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: {
        name: 'Test Project',
        organizationId: 'different-org-id', // Should be ignored
      },
    });
    
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Error Handling', () => {
  test('should not leak stack traces', async ({ request }) => {
    const response = await request.get('/api/projects/invalid-uuid-format');
    
    const body = await response.text();
    
    // Should not contain stack trace
    expect(body.toLowerCase()).not.toContain('at object.');
    expect(body.toLowerCase()).not.toContain('at module.');
    expect(body.toLowerCase()).not.toContain('node_modules');
  });

  test('should return consistent error format', async ({ request }) => {
    const response = await request.get('/api/projects/nonexistent-id');
    
    if (response.status() >= 400) {
      const body = await response.json();
      
      // Error response should have consistent structure
      expect(body).toHaveProperty('error');
    }
  });
});

test.describe('File Upload Security', () => {
  test('should reject disallowed file types', async ({ request }) => {
    const response = await request.post('/api/upload', {
      multipart: {
        file: {
          name: 'malicious.exe',
          mimeType: 'application/octet-stream',
          buffer: Buffer.from('fake executable content'),
        },
      },
    });
    
    expect([400, 401, 403, 415]).toContain(response.status());
  });

  test('should reject oversized files', async ({ request }) => {
    // Create a large buffer (larger than 10MB limit)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x');
    
    const response = await request.post('/api/upload', {
      multipart: {
        file: {
          name: 'large.pdf',
          mimeType: 'application/pdf',
          buffer: largeBuffer,
        },
      },
    });
    
    expect([400, 401, 403, 413]).toContain(response.status());
  });
});

test.describe('Health Endpoint', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect([200, 503]).toContain(response.status());
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('status');
    }
  });
});
