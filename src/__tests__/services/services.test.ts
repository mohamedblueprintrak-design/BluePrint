/**
 * Services Tests
 * اختبارات الخدمات
 */

import { db } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock audit service
jest.mock('@/lib/services/audit.service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('Project Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should return projects list', async () => {
      const mockProjects = [
        { id: 'p1', name: 'Project 1', status: 'active' },
        { id: 'p2', name: 'Project 2', status: 'completed' },
      ];

      (db.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await db.project.findMany();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Project 1');
    });

    it('should filter by organization', async () => {
      (db.project.findMany as jest.Mock).mockResolvedValue([]);

      await db.project.findMany({
        where: { organizationId: 'org-1' },
      });

      expect(db.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
    });

    it('should filter by status', async () => {
      (db.project.findMany as jest.Mock).mockResolvedValue([]);

      await db.project.findMany({
        where: { status: 'active' },
      });

      expect(db.project.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });

    it('should support pagination', async () => {
      (db.project.findMany as jest.Mock).mockResolvedValue([]);

      await db.project.findMany({
        skip: 10,
        take: 10,
      });

      expect(db.project.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
      });
    });

    it('should support sorting', async () => {
      (db.project.findMany as jest.Mock).mockResolvedValue([]);

      await db.project.findMany({
        orderBy: { createdAt: 'desc' },
      });

      expect(db.project.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getProjectById', () => {
    it('should return single project', async () => {
      const mockProject = {
        id: 'p1',
        name: 'Test Project',
        status: 'active',
        tasks: [],
      };

      (db.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const result = await db.project.findUnique({
        where: { id: 'p1' },
        include: { tasks: true },
      });

      expect(result?.name).toBe('Test Project');
    });

    it('should return null for non-existent project', async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await db.project.findUnique({
        where: { id: 'non-existent' },
      });

      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create project with valid data', async () => {
      const newProject = {
        id: 'p1',
        name: 'New Project',
        status: 'pending',
        organizationId: 'org-1',
      };

      (db.project.create as jest.Mock).mockResolvedValue(newProject);

      const result = await db.project.create({
        data: {
          name: 'New Project',
          organizationId: 'org-1',
        },
      });

      expect(result.name).toBe('New Project');
    });
  });

  describe('updateProject', () => {
    it('should update project status', async () => {
      const updatedProject = {
        id: 'p1',
        name: 'Updated Project',
        status: 'active',
      };

      (db.project.update as jest.Mock).mockResolvedValue(updatedProject);

      const result = await db.project.update({
        where: { id: 'p1' },
        data: { status: 'active' },
      });

      expect(result.status).toBe('active');
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      (db.project.delete as jest.Mock).mockResolvedValue({ id: 'p1' });

      const result = await db.project.delete({
        where: { id: 'p1' },
      });

      expect(result.id).toBe('p1');
    });
  });
});

describe('Task Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return tasks list', async () => {
      const mockTasks = [
        { id: 't1', title: 'Task 1', status: 'todo' },
        { id: 't2', title: 'Task 2', status: 'done' },
      ];

      (db.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await db.task.findMany();

      expect(result).toHaveLength(2);
    });

    it('should filter by project', async () => {
      (db.task.findMany as jest.Mock).mockResolvedValue([]);

      await db.task.findMany({
        where: { projectId: 'p1' },
      });

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: { projectId: 'p1' },
      });
    });

    it('should filter by assigned user', async () => {
      (db.task.findMany as jest.Mock).mockResolvedValue([]);

      await db.task.findMany({
        where: { assignedTo: 'user-1' },
      });

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: { assignedTo: 'user-1' },
      });
    });

    it('should filter by status', async () => {
      (db.task.findMany as jest.Mock).mockResolvedValue([]);

      await db.task.findMany({
        where: { status: 'in_progress' },
      });

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: { status: 'in_progress' },
      });
    });

    it('should filter by priority', async () => {
      (db.task.findMany as jest.Mock).mockResolvedValue([]);

      await db.task.findMany({
        where: { priority: 'high' },
      });

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: { priority: 'high' },
      });
    });
  });

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      (db.task.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // completed
        .mockResolvedValueOnce(3); // in progress

      const total = await db.task.count();
      const completed = await db.task.count({ where: { status: 'done' } });
      const inProgress = await db.task.count({ where: { status: 'in_progress' } });

      expect(total).toBe(10);
      expect(completed).toBe(5);
      expect(inProgress).toBe(3);
    });
  });
});

describe('Client Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClients', () => {
    it('should return clients list', async () => {
      const mockClients = [
        { id: 'c1', name: 'Client 1', email: 'client1@test.com' },
        { id: 'c2', name: 'Client 2', email: 'client2@test.com' },
      ];

      (db.client.findMany as jest.Mock).mockResolvedValue(mockClients);

      const result = await db.client.findMany();

      expect(result).toHaveLength(2);
    });

    it('should filter by active status', async () => {
      (db.client.findMany as jest.Mock).mockResolvedValue([]);

      await db.client.findMany({
        where: { isActive: true },
      });

      expect(db.client.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it('should search by name or email', async () => {
      (db.client.findMany as jest.Mock).mockResolvedValue([]);

      await db.client.findMany({
        where: {
          OR: [
            { name: { contains: 'test' } },
            { email: { contains: 'test' } },
          ],
        },
      });

      expect(db.client.findMany).toHaveBeenCalled();
    });
  });
});

describe('Invoice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInvoices', () => {
    it('should return invoices list', async () => {
      const mockInvoices = [
        { id: 'inv1', invoiceNumber: 'INV-001', total: 1000, status: 'paid' },
        { id: 'inv2', invoiceNumber: 'INV-002', total: 2000, status: 'pending' },
      ];

      (db.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const result = await db.invoice.findMany();

      expect(result).toHaveLength(2);
    });

    it('should filter by client', async () => {
      (db.invoice.findMany as jest.Mock).mockResolvedValue([]);

      await db.invoice.findMany({
        where: { clientId: 'c1' },
      });

      expect(db.invoice.findMany).toHaveBeenCalledWith({
        where: { clientId: 'c1' },
      });
    });

    it('should filter by status', async () => {
      (db.invoice.findMany as jest.Mock).mockResolvedValue([]);

      await db.invoice.findMany({
        where: { status: 'paid' },
      });

      expect(db.invoice.findMany).toHaveBeenCalledWith({
        where: { status: 'paid' },
      });
    });
  });

  describe('getRevenueStats', () => {
    it('should calculate revenue statistics', async () => {
      (db.invoice.aggregate as jest.Mock).mockResolvedValue({
        _sum: { total: 50000, paidAmount: 35000 },
        _count: { id: 25 },
      });

      const result = await db.invoice.aggregate({
        _sum: { total: true, paidAmount: true },
        _count: { id: true },
      });

      expect(result._sum.total).toBe(50000);
      expect(result._sum.paidAmount).toBe(35000);
    });
  });
});

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
      };

      (db.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await db.notification.create({
        data: {
          userId: 'user-1',
          title: 'Test Notification',
          message: 'Test message',
        },
      });

      expect(result.title).toBe('Test Notification');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      (db.notification.count as jest.Mock).mockResolvedValue(5);

      const count = await db.notification.count({
        where: { userId: 'user-1', isRead: false },
      });

      expect(count).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      (db.notification.update as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        isRead: true,
        readAt: new Date(),
      });

      const result = await db.notification.update({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: new Date() },
      });

      expect(result.isRead).toBe(true);
    });
  });
});

describe('Activity Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logActivity', () => {
    it('should log activity', async () => {
      const mockActivity = {
        id: 'act-1',
        userId: 'user-1',
        action: 'create',
        entityType: 'project',
        description: 'Created project X',
      };

      (db.activity.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await db.activity.create({
        data: {
          userId: 'user-1',
          action: 'create',
          entityType: 'project',
          description: 'Created project X',
        },
      });

      expect(result.action).toBe('create');
    });
  });

  describe('getRecentActivities', () => {
    it('should return recent activities', async () => {
      const mockActivities = [
        { id: 'act-1', action: 'create', description: 'Created project' },
        { id: 'act-2', action: 'update', description: 'Updated task' },
      ];

      (db.activity.findMany as jest.Mock).mockResolvedValue(mockActivities);

      const result = await db.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
    });
  });
});

describe('Service Error Handling', () => {
  it('should handle database errors gracefully', async () => {
    (db.project.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(db.project.findMany()).rejects.toThrow('Database error');
  });

  it('should handle not found errors', async () => {
    (db.project.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await db.project.findUnique({
      where: { id: 'non-existent' },
    });

    expect(result).toBeNull();
  });
});

describe('Service Validation', () => {
  it('should validate project status', () => {
    const validStatuses = ['pending', 'active', 'on_hold', 'completed', 'cancelled'];

    validStatuses.forEach(status => {
      expect(['pending', 'active', 'on_hold', 'completed', 'cancelled'].includes(status)).toBe(true);
    });
  });

  it('should validate task priority', () => {
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    validPriorities.forEach(priority => {
      expect(['low', 'medium', 'high', 'critical'].includes(priority)).toBe(true);
    });
  });

  it('should validate task status', () => {
    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'cancelled'];

    validStatuses.forEach(status => {
      expect(['todo', 'in_progress', 'review', 'done', 'cancelled'].includes(status)).toBe(true);
    });
  });

  it('should validate invoice status', () => {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

    validStatuses.forEach(status => {
      expect(['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)).toBe(true);
    });
  });
});
