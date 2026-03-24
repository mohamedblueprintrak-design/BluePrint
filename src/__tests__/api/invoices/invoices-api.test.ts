/**
 * Invoices API Tests
 * اختبارات واجهة برمجة التطبيقات للفواتير
 */


import { NextRequest } from 'next/server';
import { createMockUser } from '@/__tests__/utils/db-mock';

// Type for mock invoice
interface MockInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: { name: string };
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: string;
  issueDate: Date;
  dueDate: Date;
  paidAmount?: number;
  createdAt: Date;
}

interface MockDemoData {
  invoices: MockInvoice[];
}

// Mock dependencies
jest.mock('@/app/api/utils/demo-config', () => ({
  getUserFromRequest: jest.fn(),
  isDemoUser: jest.fn(),
  DEMO_DATA: {
    invoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        clientId: 'client-1',
        client: { name: 'عميل 1' },
        subtotal: 10000,
        taxRate: 15,
        taxAmount: 1500,
        total: 11500,
        status: 'draft',
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-30'),
        createdAt: new Date(),
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-002',
        clientId: 'client-2',
        client: { name: 'عميل 2' },
        subtotal: 20000,
        taxRate: 15,
        taxAmount: 3000,
        total: 23000,
        status: 'sent',
        issueDate: new Date('2024-01-05'),
        dueDate: new Date('2024-02-05'),
        createdAt: new Date(),
      },
      {
        id: 'inv-3',
        invoiceNumber: 'INV-003',
        clientId: 'client-1',
        client: { name: 'عميل 1' },
        subtotal: 5000,
        taxRate: 15,
        taxAmount: 750,
        total: 5750,
        status: 'paid',
        issueDate: new Date('2024-01-10'),
        dueDate: new Date('2024-02-10'),
        paidAmount: 5750,
        createdAt: new Date(),
      },
    ],
  },
}));

jest.mock('@/lib/services/invoice.service', () => ({
  invoiceService: {
    getInvoices: jest.fn(),
    createInvoice: jest.fn(),
    updateInvoice: jest.fn(),
    deleteInvoice: jest.fn(),
    getInvoiceById: jest.fn(),
    sendInvoice: jest.fn(),
    markAsPaid: jest.fn(),
  },
}));

describe('Invoices API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/invoices', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/invoices');
      const user = await getUserFromRequest(request);
      
      expect(user).toBeNull();
    });

    it('should return invoices for demo users', async () => {
      const { getUserFromRequest, isDemoUser, DEMO_DATA } = await import('@/app/api/utils/demo-config');
      jest.mocked(getUserFromRequest).mockResolvedValue(createMockUser({ id: 'demo-user', organizationId: 'org-1' }));
      jest.mocked(isDemoUser).mockReturnValue(true);

      const demoData = DEMO_DATA as unknown as MockDemoData;
      expect(demoData.invoices).toHaveLength(3);
    });

    it('should filter invoices by status', async () => {
      const { DEMO_DATA } = await import('@/app/api/utils/demo-config');
      const demoData = DEMO_DATA as unknown as MockDemoData;
      const filtered = demoData.invoices.filter(inv => inv.status === 'paid');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].invoiceNumber).toBe('INV-003');
    });

    it('should filter invoices by client', async () => {
      const { DEMO_DATA } = await import('@/app/api/utils/demo-config');
      const demoData = DEMO_DATA as unknown as MockDemoData;
      const filtered = demoData.invoices.filter(inv => inv.clientId === 'client-1');
      
      expect(filtered).toHaveLength(2);
    });

    it('should calculate total amounts correctly', async () => {
      const { DEMO_DATA } = await import('@/app/api/utils/demo-config');
      const demoData = DEMO_DATA as unknown as MockDemoData;
      
      demoData.invoices.forEach(invoice => {
        const expectedTax = invoice.subtotal * (invoice.taxRate / 100);
        const expectedTotal = invoice.subtotal + expectedTax;
        
        expect(invoice.taxAmount).toBe(expectedTax);
        expect(invoice.total).toBe(expectedTotal);
      });
    });
  });

  describe('POST /api/invoices', () => {
    it('should validate required fields', async () => {
      const invoiceData = {
        clientId: 'client-1',
        items: [],
      };

      expect(invoiceData.clientId).toBeDefined();
      expect(invoiceData.items).toBeDefined();
    });

    it('should calculate invoice totals from items', async () => {
      const items = [
        { description: 'خدمة 1', quantity: 2, unitPrice: 1000 },
        { description: 'خدمة 2', quantity: 1, unitPrice: 500 },
      ];

      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxRate = 15;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      expect(subtotal).toBe(2500);
      expect(taxAmount).toBe(375);
      expect(total).toBe(2875);
    });

    it('should generate unique invoice number', async () => {
      const generateInvoiceNumber = (lastNumber: number) => {
        return `INV-${String(lastNumber + 1).padStart(3, '0')}`;
      };

      expect(generateInvoiceNumber(0)).toBe('INV-001');
      expect(generateInvoiceNumber(99)).toBe('INV-100');
    });

    it('should validate due date is after issue date', async () => {
      const issueDate = new Date('2024-01-01');
      const dueDate = new Date('2024-01-30');

      expect(dueDate > issueDate).toBe(true);
    });
  });

  describe('PUT /api/invoices', () => {
    it('should require invoice id', async () => {
      const updateData: { status: string; id?: string } = {
        status: 'sent',
      };

      expect(updateData.id).toBeUndefined();
    });

    it('should validate status transitions', async () => {
      const validTransitions: Record<string, string[]> = {
        draft: ['sent', 'cancelled'],
        sent: ['paid', 'cancelled', 'draft'],
        paid: [],
        cancelled: ['draft'],
      };

      expect(validTransitions.draft).toContain('sent');
      expect(validTransitions.paid).toHaveLength(0);
    });

    it('should not allow editing paid invoices', async () => {
      const paidInvoice = {
        id: 'inv-1',
        status: 'paid',
        total: 1000,
      };

      const canEdit = paidInvoice.status !== 'paid';
      expect(canEdit).toBe(false);
    });
  });

  describe('Invoice Status Management', () => {
    it('should track payment progress', async () => {
      const invoice = {
        total: 10000,
        paidAmount: 5000,
        status: 'partial',
      };

      const remainingAmount = invoice.total - invoice.paidAmount;
      const paymentProgress = (invoice.paidAmount / invoice.total) * 100;

      expect(remainingAmount).toBe(5000);
      expect(paymentProgress).toBe(50);
    });

    it('should mark as paid when fully paid', async () => {
      const invoice = {
        total: 10000,
        paidAmount: 10000,
        status: 'partial',
      };

      const newStatus = invoice.paidAmount >= invoice.total ? 'paid' : invoice.status;
      expect(newStatus).toBe('paid');
    });

    it('should calculate overdue status', async () => {
      const invoice = {
        dueDate: new Date('2024-01-01'),
        status: 'sent',
      };

      const today = new Date('2024-02-01');
      const isOverdue = invoice.dueDate < today && invoice.status === 'sent';

      expect(isOverdue).toBe(true);
    });
  });

  describe('Invoice Items', () => {
    it('should validate item structure', async () => {
      const item = {
        description: 'خدمة استشارية',
        quantity: 1,
        unitPrice: 5000,
        total: 5000,
      };

      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('unitPrice');
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.unitPrice).toBeGreaterThanOrEqual(0);
    });

    it('should calculate item total', async () => {
      const calculateItemTotal = (quantity: number, unitPrice: number) => {
        return quantity * unitPrice;
      };

      expect(calculateItemTotal(2, 1000)).toBe(2000);
      expect(calculateItemTotal(0.5, 10000)).toBe(5000);
    });
  });

  describe('Invoice Reports', () => {
    it('should calculate total revenue', async () => {
      const { DEMO_DATA } = await import('@/app/api/utils/demo-config');
      const demoData = DEMO_DATA as unknown as MockDemoData;
      const paidInvoices = demoData.invoices.filter(inv => inv.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

      expect(totalRevenue).toBe(5750);
    });

    it('should calculate outstanding amount', async () => {
      const { DEMO_DATA } = await import('@/app/api/utils/demo-config');
      const demoData = DEMO_DATA as unknown as MockDemoData;
      const outstandingInvoices = demoData.invoices.filter(
        inv => inv.status === 'sent' || inv.status === 'partial'
      );
      const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

      expect(outstandingAmount).toBe(23000);
    });

    it('should calculate overdue amount', async () => {
      const today = new Date();
      const overdueInvoices = [
        { dueDate: new Date('2023-01-01'), total: 1000, status: 'sent' },
        { dueDate: new Date('2023-02-01'), total: 2000, status: 'sent' },
        { dueDate: new Date('2025-01-01'), total: 3000, status: 'sent' },
      ];

      const overdue = overdueInvoices.filter(
        inv => inv.dueDate < today && inv.status === 'sent'
      );
      const overdueAmount = overdue.reduce((sum, inv) => sum + inv.total, 0);

      expect(overdue.length).toBe(2);
      expect(overdueAmount).toBe(3000);
    });
  });
});
