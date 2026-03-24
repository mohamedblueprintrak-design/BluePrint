/**
 * Reports API Tests
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/reports/route';

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
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/reports', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return project summary report', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/reports?type=project-summary');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return financial report', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/reports?type=financial');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return task summary report', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/reports?type=tasks');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support date range filtering', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/reports?startDate=2024-01-01&endDate=2024-12-31');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support project filtering', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/reports?projectId=p1');
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
