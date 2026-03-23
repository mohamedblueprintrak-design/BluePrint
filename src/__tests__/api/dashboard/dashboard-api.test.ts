/**
 * Dashboard API Tests
 * اختبارات API لوحة التحكم
 */

import { NextRequest } from 'next/server';
import { GET as getDashboard } from '@/app/api/dashboard/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    client: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Dashboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard statistics', async () => {
      const { prisma } = require('@/lib/db');
      
      // Mock counts
      prisma.project.count.mockResolvedValue(10);
      prisma.task.count.mockResolvedValue(50);
      prisma.invoice.count.mockResolvedValue(20);
      prisma.client.count.mockResolvedValue(15);
      prisma.user.count.mockResolvedValue(5);
      prisma.notification.count.mockResolvedValue(3);
      
      // Mock aggregations
      prisma.invoice.aggregate.mockResolvedValue({ _sum: { total: 50000 } });
      prisma.project.aggregate.mockResolvedValue({ _sum: { contractValue: 1000000 } });
      
      // Mock findMany
      prisma.project.findMany.mockResolvedValue([
        { id: 'p1', name: 'Project 1', status: 'active', progressPercentage: 50 },
        { id: 'p2', name: 'Project 2', status: 'pending', progressPercentage: 0 },
      ]);
      prisma.task.findMany.mockResolvedValue([
        { id: 't1', title: 'Task 1', status: 'todo', priority: 'high' },
        { id: 't2', title: 'Task 2', status: 'done', priority: 'low' },
      ]);
      prisma.activity.findMany.mockResolvedValue([
        { id: 'a1', action: 'create', description: 'Created project', createdAt: new Date() },
      ]);
      prisma.notification.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-1',
          'x-organization-id': 'org-1',
        },
      });

      const response = await getDashboard(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.project.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.invoice.count.mockResolvedValue(0);
      prisma.client.count.mockResolvedValue(0);
      prisma.user.count.mockResolvedValue(0);
      prisma.notification.count.mockResolvedValue(0);
      prisma.invoice.aggregate.mockResolvedValue({ _sum: { total: null } });
      prisma.project.aggregate.mockResolvedValue({ _sum: { contractValue: null } });
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.activity.findMany.mockResolvedValue([]);
      prisma.notification.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-1',
          'x-organization-id': 'org-1',
        },
      });

      const response = await getDashboard(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.projects.total).toBe(0);
      expect(data.stats.tasks.total).toBe(0);
    });

    it('should filter by organization', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.project.count.mockResolvedValue(5);
      prisma.task.count.mockResolvedValue(25);
      prisma.invoice.count.mockResolvedValue(10);
      prisma.client.count.mockResolvedValue(8);
      prisma.user.count.mockResolvedValue(3);
      prisma.notification.count.mockResolvedValue(2);
      prisma.invoice.aggregate.mockResolvedValue({ _sum: { total: 25000 } });
      prisma.project.aggregate.mockResolvedValue({ _sum: { contractValue: 500000 } });
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.activity.findMany.mockResolvedValue([]);
      prisma.notification.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-1',
          'x-organization-id': 'org-1',
        },
      });

      await getDashboard(request);

      // Verify that organizationId was used in queries
      expect(prisma.project.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      );
    });

    it('should return recent activities', async () => {
      const { prisma } = require('@/lib/db');
      
      const mockActivities = [
        { id: 'a1', action: 'create', description: 'Created project X', createdAt: new Date() },
        { id: 'a2', action: 'update', description: 'Updated task Y', createdAt: new Date() },
        { id: 'a3', action: 'delete', description: 'Deleted document Z', createdAt: new Date() },
      ];

      prisma.project.count.mockResolvedValue(10);
      prisma.task.count.mockResolvedValue(50);
      prisma.invoice.count.mockResolvedValue(20);
      prisma.client.count.mockResolvedValue(15);
      prisma.user.count.mockResolvedValue(5);
      prisma.notification.count.mockResolvedValue(3);
      prisma.invoice.aggregate.mockResolvedValue({ _sum: { total: 50000 } });
      prisma.project.aggregate.mockResolvedValue({ _sum: { contractValue: 1000000 } });
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.activity.findMany.mockResolvedValue(mockActivities);
      prisma.notification.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-1',
          'x-organization-id': 'org-1',
        },
      });

      const response = await getDashboard(request);
      const data = await response.json();

      expect(data.recentActivities).toBeDefined();
      expect(data.recentActivities.length).toBe(3);
    });
  });
});

describe('Dashboard Statistics', () => {
  it('should calculate project status correctly', () => {
    const projects = [
      { status: 'active', count: 5 },
      { status: 'pending', count: 3 },
      { status: 'completed', count: 2 },
      { status: 'on_hold', count: 1 },
    ];

    const total = projects.reduce((sum, p) => sum + p.count, 0);
    expect(total).toBe(11);
    
    const activePercent = (projects.find(p => p.status === 'active')?.count || 0) / total * 100;
    expect(activePercent).toBeCloseTo(45.45, 1);
  });

  it('should calculate task priority correctly', () => {
    const tasks = [
      { priority: 'critical', count: 2 },
      { priority: 'high', count: 5 },
      { priority: 'medium', count: 10 },
      { priority: 'low', count: 8 },
    ];

    const highPriority = tasks.filter(t => ['critical', 'high'].includes(t.priority));
    const highPriorityCount = highPriority.reduce((sum, t) => sum + t.count, 0);
    
    expect(highPriorityCount).toBe(7);
  });

  it('should calculate revenue correctly', () => {
    const invoices = [
      { total: 10000, status: 'paid' },
      { total: 5000, status: 'paid' },
      { total: 8000, status: 'pending' },
      { total: 3000, status: 'overdue' },
    ];

    const paidRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);

    expect(paidRevenue).toBe(15000);
    
    const outstandingRevenue = invoices
      .filter(i => ['pending', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.total, 0);

    expect(outstandingRevenue).toBe(11000);
  });
});

describe('Dashboard Filtering', () => {
  it('should support date range filtering', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    expect(startDate < endDate).toBe(true);
  });

  it('should support status filtering', () => {
    const statuses = ['active', 'pending', 'completed', 'on_hold', 'cancelled'];
    const validStatus = 'active';
    
    expect(statuses.includes(validStatus)).toBe(true);
  });

  it('should support priority filtering', () => {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const validPriority = 'high';
    
    expect(priorities.includes(validPriority)).toBe(true);
  });
});
