/**
 * Projects API Tests
 * اختبارات واجهة برمجة التطبيقات للمشاريع
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/app/api/utils/demo-config', () => ({
  getUserFromRequest: vi.fn(),
  isDemoUser: vi.fn(),
  DEMO_DATA: {
    projects: [
      {
        id: 'proj-1',
        name: 'مشروع تجريبي 1',
        projectNumber: 'PRJ-001',
        location: 'الرياض',
        status: 'active',
        contractValue: 1000000,
        clientId: 'client-1',
        client: { name: 'عميل 1' },
        progressPercentage: 50,
        createdAt: new Date(),
      },
      {
        id: 'proj-2',
        name: 'مشروع تجريبي 2',
        projectNumber: 'PRJ-002',
        location: 'جدة',
        status: 'pending',
        contractValue: 500000,
        clientId: 'client-2',
        client: { name: 'عميل 2' },
        progressPercentage: 0,
        createdAt: new Date(),
      },
    ],
  },
}));

vi.mock('@/lib/services', () => ({
  projectService: {
    getProjects: vi.fn(),
    createProject: vi.fn(),
    getProjectById: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

describe('Projects API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/projects');
      const { GET } = await import('@/app/api/projects/route');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return projects for authenticated users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'demo-user',
        organizationId: 'org-1',
        role: 'admin',
      });
      vi.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/projects');
      const { GET } = await import('@/app/api/projects/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('should filter projects by status', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'demo-user',
        organizationId: 'org-1',
        role: 'admin',
      });
      vi.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/projects?status=active');
      const { GET } = await import('@/app/api/projects/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('active');
    });

    it('should search projects by name', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'demo-user',
        organizationId: 'org-1',
        role: 'admin',
      });
      vi.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/projects?search=تجريبي 1');
      const { GET } = await import('@/app/api/projects/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toContain('تجريبي 1');
    });

    it('should paginate results', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'demo-user',
        organizationId: 'org-1',
        role: 'admin',
      });
      vi.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/projects?page=1&limit=1');
      const { GET } = await import('@/app/api/projects/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.totalPages).toBe(2);
    });
  });

  describe('POST /api/projects', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'مشروع جديد' }),
      });
      const { POST } = await import('@/app/api/projects/route');
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for demo users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'demo-user',
        organizationId: 'org-1',
        role: 'admin',
      });
      vi.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'مشروع جديد' }),
      });
      const { POST } = await import('@/app/api/projects/route');
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'real-user',
        organizationId: 'org-1',
        role: 'admin',
      });
      vi.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({}), // Missing name
      });
      const { POST } = await import('@/app/api/projects/route');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create project for authenticated users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      const { projectService } = await import('@/lib/services');

      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'real-user',
        organizationId: 'org-1',
        role: 'admin',
      });
      vi.mocked(isDemoUser).mockReturnValue(false);

      vi.mocked(projectService.createProject).mockResolvedValue({
        id: 'new-proj',
        projectNumber: 'PRJ-003',
        name: 'مشروع جديد',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'مشروع جديد',
          location: 'الدمام',
          contractValue: 2000000,
        }),
      });
      const { POST } = await import('@/app/api/projects/route');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('مشروع جديد');
    });
  });
});
