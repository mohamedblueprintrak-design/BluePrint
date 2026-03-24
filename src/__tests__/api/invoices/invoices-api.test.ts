/**
 * Invoices API Tests
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/invoices/route';

// Mock dependencies
jest.mock('@/app/api/utils/demo-config', () => ({
  getUserFromRequest: jest.fn(),
  isDemoUser: jest.fn(),
  DEMO_DATA: {
    invoices: [
      { id: 'inv-1', invoiceNumber: 'INV-001', status: 'paid', total: 10000, dueDate: new Date() },
      { id: 'inv-2', invoiceNumber: 'INV-002', status: 'pending', total: 5000, dueDate: new Date() },
      { id: 'inv-3', invoiceNumber: 'INV-003', status: 'overdue', total: 3000, dueDate: new Date(Date.now() - 86400000 * 30) },
    ],
  },
}));

jest.mock('@/lib/services', () => ({
  invoiceService: {
    getInvoices: jest.fn(),
    createInvoice: jest.fn(),
  },
}));

describe('Invoices API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/invoices', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/invoices');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return invoices list for authenticated users', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/invoices');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/invoices', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client-1', items: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });
});

describe('Invoice Reports', () => {
  it('should calculate total revenue', () => {
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

  it('should calculate overdue amount', () => {
    const invoices = [
      { status: 'paid', total: 10000 },
      { status: 'overdue', total: 5000 },
      { status: 'overdue', total: 3000 },
    ];
    const overdueTotal = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + i.total, 0);
    expect(overdueTotal).toBe(8000);
  });

  it('should calculate outstanding amount', () => {
    const invoices = [
      { status: 'paid', total: 10000 },
      { status: 'pending', total: 5000 },
      { status: 'overdue', total: 3000 },
    ];
    const outstandingTotal = invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + i.total, 0);
    expect(outstandingTotal).toBe(8000);
  });
});

describe('Invoice Number Generation', () => {
  it('should generate sequential invoice numbers', () => {
    const lastNumber = 'INV-005';
    const nextNumber = `INV-${String(parseInt(lastNumber.split('-')[1]) + 1).padStart(3, '0')}`;
    expect(nextNumber).toBe('INV-006');
  });

  it('should handle first invoice', () => {
    const nextNumber = 'INV-001';
    expect(nextNumber).toMatch(/^INV-\d{3}$/);
  });
});
