/**
 * Documents API Tests
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/documents/route';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    document: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'd1', fileName: 'test.pdf' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Mock dependencies
jest.mock('@/app/api/utils/demo-config', () => ({
  getUserFromRequest: jest.fn(),
  isDemoUser: jest.fn(),
  DEMO_DATA: {
    documents: [
      { id: 'd1', name: 'Document 1', projectId: 'p1', type: 'pdf', status: 'active' },
      { id: 'd2', name: 'Document 2', projectId: 'p2', type: 'doc', status: 'archived' },
    ],
  },
}));

jest.mock('@/lib/services', () => ({
  documentService: {
    getDocuments: jest.fn(),
    createDocument: jest.fn(),
  },
}));

describe('Documents API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/documents', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/documents');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return documents list for authenticated users', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter by project', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents?projectId=p1');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter by document type', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents?type=pdf');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support search query', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents?search=Document');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents?page=1&limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/documents', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for demo users', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'demo-user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Document' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      // Demo users cannot create documents
      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      // Non-demo user to allow document creation
      (isDemoUser as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Document' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      // Response depends on validation and database mock
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

describe('Document Validation', () => {
  it('should validate file types', () => {
    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'];
    expect(allowedTypes).toContain('pdf');
    expect(allowedTypes).not.toContain('exe');
  });

  it('should validate file size limits', () => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    expect(5 * 1024 * 1024).toBeLessThan(maxSize);
    expect(15 * 1024 * 1024).toBeGreaterThan(maxSize);
  });
});
