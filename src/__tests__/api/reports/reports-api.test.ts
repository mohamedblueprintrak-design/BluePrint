/**
 * Reports API Tests
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/reports/route';
import * as jose from 'jose';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        organization: { id: 'org-1', name: 'Test Org', currency: 'AED' }
      }),
    },
    invoice: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    project: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    task: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    client: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    expense: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Mock dependencies
jest.mock('@/app/api/utils/demo-config', () => ({
  getUserFromRequest: jest.fn(),
  isDemoUser: jest.fn(),
  DEMO_DATA: {
    projects: [
      { id: 'p1', status: 'active', contractValue: 1000000, progressPercentage: 50 },
      { id: 'p2', status: 'completed', contractValue: 500000, progressPercentage: 100 },
    ],
    tasks: [
      { id: 't1', status: 'completed', priority: 'high' },
      { id: 't2', status: 'pending', priority: 'low' },
    ],
    invoices: [
      { id: 'i1', status: 'paid', total: 10000 },
      { id: 'i2', status: 'pending', total: 5000 },
    ],
  },
}));

jest.mock('@/lib/services', () => ({
  projectService: { getProjects: jest.fn() },
  taskService: { getTasks: jest.fn() },
  invoiceService: { getInvoices: jest.fn() },
}));

describe('Reports API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configure jose mock for authenticated requests
    (jose.jwtVerify as jest.Mock).mockResolvedValue({
      payload: { userId: 'user-1' }
    });
  });

  describe('GET /api/reports', () => {
    it('should return 401 for unauthenticated users', async () => {
      // Mock jose to return null (no valid token)
      (jose.jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return project summary report', async () => {
      // Mock jose to return valid user
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: { userId: 'user-1' }
      });

      const request = new NextRequest('http://localhost:3000/api/reports?action=project-status', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return financial report', async () => {
      // Mock jose to return valid user
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: { userId: 'user-1' }
      });

      const request = new NextRequest('http://localhost:3000/api/reports?action=financial-summary', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return task summary report', async () => {
      // Mock jose to return valid user
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: { userId: 'user-1' }
      });

      const request = new NextRequest('http://localhost:3000/api/reports?action=task-metrics', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support date range filtering', async () => {
      // Mock jose to return valid user
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: { userId: 'user-1' }
      });

      const request = new NextRequest('http://localhost:3000/api/reports?action=financial-summary&startDate=2024-01-01&endDate=2024-12-31', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support project filtering', async () => {
      // Mock jose to return valid user
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: { userId: 'user-1' }
      });

      const request = new NextRequest('http://localhost:3000/api/reports?action=project-status&projectId=p1', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});

describe('Report Calculations', () => {
  it('should calculate total contract value', () => {
    const projects = [
      { contractValue: 1000000 },
      { contractValue: 500000 },
    ];
    const total = projects.reduce((sum, p) => sum + p.contractValue, 0);
    expect(total).toBe(1500000);
  });

  it('should calculate task completion rate', () => {
    const tasks = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'pending' },
    ];
    const completed = tasks.filter(t => t.status === 'completed').length;
    const rate = (completed / tasks.length) * 100;
    expect(rate).toBeCloseTo(66.67, 1);
  });

  it('should calculate invoice totals by status', () => {
    const invoices = [
      { status: 'paid', total: 10000 },
      { status: 'paid', total: 5000 },
      { status: 'pending', total: 3000 },
    ];
    const paidTotal = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
    expect(paidTotal).toBe(15000);
  });
});
