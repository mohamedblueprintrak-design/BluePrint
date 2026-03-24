/**
 * Tasks API Tests
 * اختبارات واجهة برمجة التطبيقات للمهام
 */


import { NextRequest } from 'next/server';
import { createMockUser } from '@/__tests__/utils/db-mock';

// Mock dependencies
jest.mock('@/app/api/utils/demo-config', () => ({
  getUserFromRequest: jest.fn(),
  isDemoUser: jest.fn(),
  DEMO_DATA: {
    tasks: [
      {
        id: 'task-1',
        title: 'مهمة تجريبية 1',
        description: 'وصف المهمة 1',
        projectId: 'proj-1',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(),
        progress: 0,
        createdAt: new Date(),
      },
      {
        id: 'task-2',
        title: 'مهمة تجريبية 2',
        description: 'وصف المهمة 2',
        projectId: 'proj-1',
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(),
        progress: 50,
        createdAt: new Date(),
      },
      {
        id: 'task-3',
        title: 'مهمة تجريبية 3',
        description: 'وصف المهمة 3',
        projectId: 'proj-2',
        status: 'done',
        priority: 'low',
        dueDate: new Date(),
        progress: 100,
        createdAt: new Date(),
      },
    ],
  },
}));

jest.mock('@/lib/services/task.service', () => ({
  taskService: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
  TaskAccessError: class TaskAccessError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'TaskAccessError';
    }
  },
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
    },
  },
}));

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const { GET } = await import('@/app/api/tasks/route');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return tasks for demo users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const { GET } = await import('@/app/api/tasks/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
    });

    it('should filter tasks by project', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/tasks?projectId=proj-1');
      const { GET } = await import('@/app/api/tasks/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/tasks?status=todo');
      const { GET } = await import('@/app/api/tasks/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('todo');
    });

    it('should filter tasks by priority', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/tasks?priority=high');
      const { GET } = await import('@/app/api/tasks/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].priority).toBe('high');
    });
  });

  describe('POST /api/tasks', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'مهمة جديدة' }),
      });
      const { POST } = await import('@/app/api/tasks/route');
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for demo users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'مهمة جديدة' }),
      });
      const { POST } = await import('@/app/api/tasks/route');
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should validate required title', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const { POST } = await import('@/app/api/tasks/route');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate title length', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'a'.repeat(501) }),
      });
      const { POST } = await import('@/app/api/tasks/route');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate priority values', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'مهمة', priority: 'invalid' }),
      });
      const { POST } = await import('@/app/api/tasks/route');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate status values', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'مهمة', status: 'invalid' }),
      });
      const { POST } = await import('@/app/api/tasks/route');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should create task for authenticated users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      const { taskService } = await import('@/lib/services/task.service');

      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      jest.mocked(taskService.createTask).mockResolvedValue({
        id: 'new-task',
        title: 'مهمة جديدة',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'مهمة جديدة',
          description: 'وصف المهمة',
          priority: 'high',
          status: 'todo',
        }),
      });
      const { POST } = await import('@/app/api/tasks/route');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('مهمة جديدة');
    });
  });

  describe('PUT /api/tasks', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ id: 'task-1', title: 'مهمة محدثة' }),
      });
      const { PUT } = await import('@/app/api/tasks/route');
      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for demo users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ id: 'task-1', title: 'مهمة محدثة' }),
      });
      const { PUT } = await import('@/app/api/tasks/route');
      const response = await PUT(request);

      expect(response.status).toBe(403);
    });

    it('should validate task id is required', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ title: 'مهمة محدثة' }),
      });
      const { PUT } = await import('@/app/api/tasks/route');
      const response = await PUT(request);

      expect(response.status).toBe(400);
    });

    it('should validate progress range', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ id: 'task-1', progress: 150 }),
      });
      const { PUT } = await import('@/app/api/tasks/route');
      const response = await PUT(request);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks?id=task-1', {
        method: 'DELETE',
      });
      const { DELETE } = await import('@/app/api/tasks/route');
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for demo users', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/tasks?id=task-1', {
        method: 'DELETE',
      });
      const { DELETE } = await import('@/app/api/tasks/route');
      const response = await DELETE(request);

      expect(response.status).toBe(403);
    });

    it('should validate task id is required', async () => {
      const { getUserFromRequest, isDemoUser } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'real-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'DELETE',
      });
      const { DELETE } = await import('@/app/api/tasks/route');
      const response = await DELETE(request);

      expect(response.status).toBe(400);
    });
  });
});
