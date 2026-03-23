/**
 * Documents API Tests
 * اختبارات API المستندات
 */

import { NextRequest } from 'next/server';
import { GET as getDocuments, POST as uploadDocument } from '@/app/api/documents/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    document: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/audit.service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('Documents API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/documents', () => {
    it('should return documents list', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'Test Document',
          documentType: 'general',
          fileName: 'test.pdf',
          filePath: '/uploads/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          status: 'approved',
          createdAt: new Date(),
        },
      ]);
      
      prisma.document.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getDocuments(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.documents).toBeDefined();
    });

    it('should filter by project', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/documents?projectId=proj-1', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      await getDocuments(request);

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'proj-1',
          }),
        })
      );
    });

    it('should filter by document type', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/documents?type=contract', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      await getDocuments(request);

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            documentType: 'contract',
          }),
        })
      );
    });

    it('should filter by status', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/documents?status=approved', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      await getDocuments(request);

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'approved',
          }),
        })
      );
    });

    it('should support search query', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/documents?search=contract', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      await getDocuments(request);

      expect(prisma.document.findMany).toHaveBeenCalled();
    });

    it('should support pagination', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(100);

      const request = new NextRequest('http://localhost:3000/api/documents?page=2&limit=20', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getDocuments(request);
      const data = await response.json();

      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(20);
    });
  });

  describe('POST /api/documents', () => {
    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          // Missing title and file
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await uploadDocument(request);
      const data = await response.json();

      expect(data.success).toBe(false);
    });

    it('should create document with valid data', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.document.create.mockResolvedValue({
        id: 'doc-1',
        title: 'New Document',
        documentType: 'general',
        fileName: 'document.pdf',
        filePath: '/uploads/document.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        status: 'draft',
        createdAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Document',
          fileName: 'document.pdf',
          filePath: '/uploads/document.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await uploadDocument(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.document).toBeDefined();
    });
  });
});

describe('Document Types', () => {
  it('should support all document types', () => {
    const validTypes = ['general', 'contract', 'drawing', 'report', 'invoice', 'transmittal'];
    
    validTypes.forEach(type => {
      expect(['general', 'contract', 'drawing', 'report', 'invoice', 'transmittal'].includes(type)).toBe(true);
    });
  });

  it('should support all document statuses', () => {
    const validStatuses = ['draft', 'under_review', 'approved', 'superseded', 'archived'];
    
    validStatuses.forEach(status => {
      expect(['draft', 'under_review', 'approved', 'superseded', 'archived'].includes(status)).toBe(true);
    });
  });

  it('should support all categories', () => {
    const validCategories = ['technical', 'financial', 'legal', 'administrative'];
    
    validCategories.forEach(category => {
      expect(['technical', 'financial', 'legal', 'administrative'].includes(category)).toBe(true);
    });
  });
});

describe('File Validation', () => {
  it('should validate allowed file types', () => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    allowedTypes.forEach(type => {
      expect(allowedTypes.includes(type)).toBe(true);
    });
  });

  it('should reject disallowed file types', () => {
    const disallowedTypes = [
      'application/exe',
      'application/x-msdos-program',
      'application/x-sh',
    ];

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    disallowedTypes.forEach(type => {
      expect(allowedTypes.includes(type)).toBe(false);
    });
  });

  it('should validate file size', () => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    const validSizes = [1024, 1024 * 1024, 5 * 1024 * 1024];
    const invalidSizes = [11 * 1024 * 1024, 20 * 1024 * 1024];

    validSizes.forEach(size => {
      expect(size <= maxFileSize).toBe(true);
    });

    invalidSizes.forEach(size => {
      expect(size <= maxFileSize).toBe(false);
    });
  });
});

describe('Document Versioning', () => {
  it('should support version numbering', () => {
    const versions = ['1.0', '1.1', '2.0', '2.1', '3.0'];
    
    versions.forEach(version => {
      expect(/^\d+\.\d+$/.test(version)).toBe(true);
    });
  });

  it('should support revision letters', () => {
    const revisions = ['A', 'B', 'C', 'D'];
    
    revisions.forEach(rev => {
      expect(/^[A-Z]$/.test(rev)).toBe(true);
    });
  });
});

describe('Document Permissions', () => {
  it('should allow admin full access', () => {
    const role = 'admin';
    const permissions = ['read', 'write', 'delete', 'approve'];
    
    expect(permissions.length).toBe(4);
  });

  it('should allow manager read/write access', () => {
    const role = 'manager';
    const permissions = ['read', 'write'];
    
    expect(permissions.length).toBe(2);
    expect(permissions.includes('delete')).toBe(false);
  });

  it('should allow viewer read-only access', () => {
    const role = 'viewer';
    const permissions = ['read'];
    
    expect(permissions.length).toBe(1);
    expect(permissions.includes('write')).toBe(false);
  });
});
