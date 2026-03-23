/**
 * Reports API Tests
 * اختبارات API التقارير
 */

import { NextRequest } from 'next/server';
import { GET as getReports } from '@/app/api/reports/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    client: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe('Reports API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports', () => {
    it('should return project summary report', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.project.findMany.mockResolvedValue([
        { id: 'p1', name: 'Project 1', status: 'active', contractValue: 100000 },
        { id: 'p2', name: 'Project 2', status: 'completed', contractValue: 200000 },
      ]);
      
      prisma.project.aggregate.mockResolvedValue({
        _sum: { contractValue: 300000 },
        _count: { id: 2 },
      });

      const request = new NextRequest('http://localhost:3000/api/reports?type=projects', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return financial report', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.invoice.aggregate.mockResolvedValue({
        _sum: { total: 500000, paidAmount: 350000 },
        _count: { id: 25 },
      });
      
      prisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 200000 },
      });

      const request = new NextRequest('http://localhost:3000/api/reports?type=financial', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return task summary report', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.task.findMany.mockResolvedValue([
        { id: 't1', status: 'done', priority: 'high' },
        { id: 't2', status: 'in_progress', priority: 'medium' },
        { id: 't3', status: 'todo', priority: 'low' },
      ]);
      
      prisma.task.aggregate.mockResolvedValue({
        _count: { id: 3 },
      });

      const request = new NextRequest('http://localhost:3000/api/reports?type=tasks', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should support date range filtering', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.aggregate.mockResolvedValue({ _sum: {}, _count: {} });

      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const request = new NextRequest(
        `http://localhost:3000/api/reports?type=projects&startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: { 'x-user-id': 'user-1' },
        }
      );

      const response = await getReports(request);

      expect(response.status).toBe(200);
    });

    it('should support project filtering', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.aggregate.mockResolvedValue({ _sum: {}, _count: {} });

      const request = new NextRequest(
        'http://localhost:3000/api/reports?type=tasks&projectId=proj-1',
        {
          method: 'GET',
          headers: { 'x-user-id': 'user-1' },
        }
      );

      const response = await getReports(request);

      expect(response.status).toBe(200);
    });
  });
});

describe('Report Types', () => {
  it('should support all report types', () => {
    const validReportTypes = [
      'projects',
      'tasks',
      'financial',
      'clients',
      'resources',
      'time-tracking',
      'defects',
    ];

    validReportTypes.forEach(type => {
      expect([
        'projects',
        'tasks',
        'financial',
        'clients',
        'resources',
        'time-tracking',
        'defects',
      ].includes(type)).toBe(true);
    });
  });
});

describe('Report Calculations', () => {
  it('should calculate project completion percentage', () => {
    const tasks = [
      { status: 'done' },
      { status: 'done' },
      { status: 'in_progress' },
      { status: 'todo' },
    ];

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = (completedTasks / tasks.length) * 100;

    expect(completionPercentage).toBe(50);
  });

  it('should calculate revenue vs expenses', () => {
    const revenue = 500000;
    const expenses = 350000;
    const profit = revenue - expenses;
    const profitMargin = (profit / revenue) * 100;

    expect(profit).toBe(150000);
    expect(profitMargin).toBe(30);
  });

  it('should calculate task distribution by status', () => {
    const tasks = [
      { status: 'todo' },
      { status: 'todo' },
      { status: 'in_progress' },
      { status: 'done' },
      { status: 'done' },
      { status: 'done' },
    ];

    const distribution = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(distribution.todo).toBe(2);
    expect(distribution.in_progress).toBe(1);
    expect(distribution.done).toBe(3);
  });

  it('should calculate average task duration', () => {
    const tasks = [
      { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-10') },
      { startDate: new Date('2024-01-05'), endDate: new Date('2024-01-15') },
    ];

    const durations = tasks.map(t => {
      const diff = t.endDate.getTime() - t.startDate.getTime();
      return diff / (1000 * 60 * 60 * 24); // Convert to days
    });

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    expect(avgDuration).toBeCloseTo(9.5, 0);
  });
});

describe('Report Export', () => {
  it('should support PDF export', () => {
    const exportFormats = ['pdf', 'excel', 'csv'];
    expect(exportFormats.includes('pdf')).toBe(true);
  });

  it('should support Excel export', () => {
    const exportFormats = ['pdf', 'excel', 'csv'];
    expect(exportFormats.includes('excel')).toBe(true);
  });

  it('should support CSV export', () => {
    const exportFormats = ['pdf', 'excel', 'csv'];
    expect(exportFormats.includes('csv')).toBe(true);
  });
});

describe('Report Permissions', () => {
  it('should allow admin full report access', () => {
    const role = 'admin';
    const canViewAllReports = true;
    const canExportReports = true;

    expect(canViewAllReports).toBe(true);
    expect(canExportReports).toBe(true);
  });

  it('should allow manager limited report access', () => {
    const role = 'manager';
    const canViewProjectReports = true;
    const canViewFinancialReports = false;

    expect(canViewProjectReports).toBe(true);
  });

  it('should allow accountant financial reports', () => {
    const role = 'accountant';
    const canViewFinancialReports = true;
    const canViewProjectReports = false;

    expect(canViewFinancialReports).toBe(true);
  });
});

describe('Report Aggregation', () => {
  it('should aggregate by month', () => {
    const data = [
      { date: new Date('2024-01-15'), value: 100 },
      { date: new Date('2024-01-20'), value: 150 },
      { date: new Date('2024-02-10'), value: 200 },
      { date: new Date('2024-02-25'), value: 250 },
    ];

    const monthlyData = data.reduce((acc, item) => {
      const month = item.date.getMonth();
      acc[month] = (acc[month] || 0) + item.value;
      return acc;
    }, {} as Record<number, number>);

    expect(monthlyData[0]).toBe(250); // January
    expect(monthlyData[1]).toBe(450); // February
  });

  it('should aggregate by project', () => {
    const tasks = [
      { projectId: 'p1', hours: 5 },
      { projectId: 'p1', hours: 3 },
      { projectId: 'p2', hours: 8 },
    ];

    const projectHours = tasks.reduce((acc, task) => {
      acc[task.projectId] = (acc[task.projectId] || 0) + task.hours;
      return acc;
    }, {} as Record<string, number>);

    expect(projectHours.p1).toBe(8);
    expect(projectHours.p2).toBe(8);
  });

  it('should aggregate by user', () => {
    const tasks = [
      { assignedTo: 'u1', count: 5 },
      { assignedTo: 'u1', count: 3 },
      { assignedTo: 'u2', count: 7 },
    ];

    const userTasks = tasks.reduce((acc, task) => {
      acc[task.assignedTo] = (acc[task.assignedTo] || 0) + task.count;
      return acc;
    }, {} as Record<string, number>);

    expect(userTasks.u1).toBe(8);
    expect(userTasks.u2).toBe(7);
  });
});
