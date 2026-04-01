/**
 * Invoice Service Unit Tests
 * Tests for invoice CRUD, status transitions, tax calculation, payments, and overdue detection.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  mockPrisma,
  setupTestDatabase,
  teardownTestDatabase,
  createTestInvoiceData,
  createTestInvoiceItemData,
  createTestUserData,
  generateTestId,
  type TestInvoice,
  type TestInvoiceItem,
} from '../../utils/setup';
import { calculateTax, TEST_CONSTANTS } from '../../utils/test-helpers';

// ─── Mock Invoice Service ────────────────────────────────────────────────────

class InvoiceService {
  async createInvoice(data: {
    projectId: string;
    clientId: string;
    items: Array<{ description: string; quantity: number; unitPrice: number; unit: string; boqItemId?: string }>;
    taxRate?: number;
    dueDate: string;
    notes?: string;
  }) {
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = data.taxRate ?? 15;
    const taxAmount = calculateTax(subtotal, taxRate);
    const total = subtotal + taxAmount;

    return mockPrisma.$transaction(async (tx: any) => {
      // Generate invoice number
      const count = await tx.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          projectId: data.projectId,
          clientId: data.clientId,
          subtotal,
          taxRate,
          taxAmount,
          total,
          paidAmount: 0,
          status: 'DRAFT',
          dueDate: data.dueDate,
          issuedDate: new Date().toISOString().split('T')[0],
          notes: data.notes,
        },
      });

      // Create invoice items
      const items = await Promise.all(
        data.items.map((item) =>
          tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unit: item.unit,
              total: item.quantity * item.unitPrice,
              boqItemId: item.boqItemId,
            },
          })
        )
      );

      return { ...invoice, items };
    });
  }

  async getInvoiceById(id: string) {
    const invoice = await mockPrisma.invoice.findUnique({
      where: { id },
      include: { items: true, project: true, client: true },
    });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    return invoice;
  }

  async updateInvoiceStatus(id: string, status: string) {
    const invoice = await mockPrisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'],
      PARTIAL: ['PAID', 'OVERDUE', 'CANCELLED'],
      PAID: [],
      OVERDUE: ['PAID', 'CANCELLED'],
      CANCELLED: [],
    };

    const allowed = validTransitions[invoice.status] || [];
    if (!allowed.includes(status)) {
      throw new Error(`INVALID_INVOICE_STATUS_TRANSITION: ${invoice.status} → ${status}`);
    }

    return mockPrisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  async recordPayment(id: string, amount: number) {
    const invoice = await mockPrisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
      throw new Error('CANNOT_RECORD_PAYMENT');
    }
    if (amount <= 0) throw new Error('INVALID_PAYMENT_AMOUNT');
    if (amount > invoice.total - invoice.paidAmount) {
      throw new Error('PAYMENT_EXCEEDS_BALANCE');
    }

    const newPaidAmount = invoice.paidAmount + amount;
    let newStatus = invoice.status;

    if (newPaidAmount >= invoice.total) {
      newStatus = 'PAID';
    } else if (invoice.status === 'SENT' || invoice.status === 'DRAFT') {
      newStatus = 'PARTIAL';
    }

    return mockPrisma.invoice.update({
      where: { id },
      data: { paidAmount: newPaidAmount, status: newStatus },
    });
  }

  async detectOverdue() {
    const overdueInvoices = await mockPrisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: new Date().toISOString().split('T')[0] },
      },
    });

    for (const invoice of overdueInvoices) {
      await mockPrisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });
    }

    return overdueInvoices.length;
  }

  async listInvoices(filters: any = {}) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.overdue === true) {
      where.status = 'OVERDUE';
    }

    const [invoices, total] = await Promise.all([
      mockPrisma.invoice.findMany({
        where,
        include: { client: true, project: true, items: true },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: { createdAt: 'desc' },
      }),
      mockPrisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters.limit || 20)),
      },
    };
  }

  async deleteInvoice(id: string) {
    const invoice = await mockPrisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status !== 'DRAFT') {
      throw new Error('CAN_ONLY_DELETE_DRAFT');
    }

    await mockPrisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    return mockPrisma.invoice.delete({ where: { id } });
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;
  let testClientId: string;
  let testProjectId: string;
  let testInvoice: TestInvoice;

  beforeEach(async () => {
    await setupTestDatabase();
    invoiceService = new InvoiceService();
    testClientId = generateTestId('client');
    testProjectId = generateTestId('project');
    testInvoice = createTestInvoiceData(testClientId, testProjectId);
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── Create Invoice Tests ─────────────────────────────────────────────────

  describe('createInvoice', () => {
    const validItems = [
      { description: 'Concrete Supply', quantity: 100, unitPrice: 250, unit: 'CUBIC_M' },
      { description: 'Steel Reinforcement', quantity: 50, unitPrice: 400, unit: 'TON' },
    ];

    it('should create an invoice with items', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue({
        ...testInvoice,
        invoiceNumber: 'INV-2024-0001',
      });
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({
        id: generateTestId('item'),
        ...args.data,
      }));

      const result = await invoiceService.createInvoice({
        projectId: testProjectId,
        clientId: testClientId,
        items: validItems,
        dueDate: '2024-06-30',
      });

      expect(result).toHaveProperty('invoiceNumber');
      expect(result.subtotal).toBe(100 * 250 + 50 * 400); // 25000 + 20000 = 45000
      expect(result.taxAmount).toBe(calculateTax(45000, 15)); // 6750
      expect(result.total).toBe(45000 + 6750); // 51750
      expect(result.status).toBe('DRAFT');
    });

    it('should calculate subtotal from item quantities and unit prices', async () => {
      const items = [
        { description: 'Item A', quantity: 10, unitPrice: 100, unit: 'PCS' },
        { description: 'Item B', quantity: 5, unitPrice: 200, unit: 'PCS' },
        { description: 'Item C', quantity: 2, unitPrice: 50, unit: 'LOT' },
      ];

      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(async (args: any) => args.data);
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({
        id: generateTestId('item'),
        ...args.data,
      }));

      const result = await invoiceService.createInvoice({
        projectId: testProjectId,
        clientId: testClientId,
        items,
        dueDate: '2024-06-30',
      });

      expect(result.subtotal).toBe(1000 + 1000 + 100); // 2100
    });

    it('should apply custom tax rate', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(async (args: any) => args.data);
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({
        id: generateTestId('item'),
        ...args.data,
      }));

      const result = await invoiceService.createInvoice({
        projectId: testProjectId,
        clientId: testClientId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 1000, unit: 'LOT' }],
        taxRate: 5,
        dueDate: '2024-06-30',
      });

      expect(result.taxRate).toBe(5);
      expect(result.taxAmount).toBe(50); // 1000 * 0.05
      expect(result.total).toBe(1050);
    });

    it('should generate sequential invoice number', async () => {
      mockPrisma.invoice.count.mockResolvedValue(42);
      mockPrisma.invoice.create.mockImplementation(async (args: any) => ({
        ...args.data,
        id: generateTestId('invoice'),
      }));
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({
        id: generateTestId('item'),
        ...args.data,
      }));

      const result = await invoiceService.createInvoice({
        projectId: testProjectId,
        clientId: testClientId,
        items: validItems,
        dueDate: '2024-06-30',
      });

      expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('should set initial paid amount to 0', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(async (args: any) => args.data);
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({
        id: generateTestId('item'),
        ...args.data,
      }));

      const result = await invoiceService.createInvoice({
        projectId: testProjectId,
        clientId: testClientId,
        items: validItems,
        dueDate: '2024-06-30',
      });

      expect(result.paidAmount).toBe(0);
    });

    it('should link invoice items to BOQ items when specified', async () => {
      const boqItemId = generateTestId('boq');
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(async (args: any) => args.data);
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({
        id: generateTestId('item'),
        ...args.data,
      }));

      await invoiceService.createInvoice({
        projectId: testProjectId,
        clientId: testClientId,
        items: [{ description: 'BOQ Item', quantity: 1, unitPrice: 500, unit: 'SQM', boqItemId }],
        dueDate: '2024-06-30',
      });

      expect(mockPrisma.invoiceItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ boqItemId }),
        })
      );
    });

    it('should use 15% default tax rate', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(async (args: any) => args.data);
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({
        id: generateTestId('item'),
        ...args.data,
      }));

      const result = await invoiceService.createInvoice({
        projectId: testProjectId,
        clientId: testClientId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 1000, unit: 'LOT' }],
        dueDate: '2024-06-30',
      });

      expect(result.taxRate).toBe(15);
    });
  });

  // ─── Invoice Status Transitions ───────────────────────────────────────────

  describe('status transitions', () => {
    it('should transition from DRAFT to SENT', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'DRAFT' });
      mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'SENT' });

      const result = await invoiceService.updateInvoiceStatus(testInvoice.id, 'SENT');

      expect(result.status).toBe('SENT');
    });

    it('should transition from SENT to PARTIAL', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'SENT' });
      mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'PARTIAL' });

      const result = await invoiceService.updateInvoiceStatus(testInvoice.id, 'PARTIAL');

      expect(result.status).toBe('PARTIAL');
    });

    it('should transition from SENT to PAID', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'SENT' });
      mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'PAID' });

      const result = await invoiceService.updateInvoiceStatus(testInvoice.id, 'PAID');

      expect(result.status).toBe('PAID');
    });

    it('should transition from PARTIAL to PAID', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'PARTIAL' });
      mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'PAID' });

      const result = await invoiceService.updateInvoiceStatus(testInvoice.id, 'PAID');

      expect(result.status).toBe('PAID');
    });

    it('should transition from OVERDUE to PAID', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'OVERDUE' });
      mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'PAID' });

      const result = await invoiceService.updateInvoiceStatus(testInvoice.id, 'PAID');

      expect(result.status).toBe('PAID');
    });

    it('should allow CANCELLED transition from any non-PAID status', async () => {
      for (const status of ['DRAFT', 'SENT', 'PARTIAL', 'OVERDUE']) {
        mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status });
        mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'CANCELLED' });

        const result = await invoiceService.updateInvoiceStatus(testInvoice.id, 'CANCELLED');
        expect(result.status).toBe('CANCELLED');
      }
    });

    it('should reject transition from PAID to any status', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'PAID' });

      await expect(invoiceService.updateInvoiceStatus(testInvoice.id, 'SENT'))
        .rejects.toThrow('INVALID_INVOICE_STATUS_TRANSITION');
    });

    it('should reject transition from DRAFT directly to PAID', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'DRAFT' });

      await expect(invoiceService.updateInvoiceStatus(testInvoice.id, 'PAID'))
        .rejects.toThrow('INVALID_INVOICE_STATUS_TRANSITION');
    });

    it('should reject transition from DRAFT directly to PARTIAL', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'DRAFT' });

      await expect(invoiceService.updateInvoiceStatus(testInvoice.id, 'PARTIAL'))
        .rejects.toThrow('INVALID_INVOICE_STATUS_TRANSITION');
    });
  });

  // ─── Tax Calculation Tests ────────────────────────────────────────────────

  describe('tax calculation', () => {
    it('should calculate 15% VAT correctly', () => {
      expect(calculateTax(100000, 15)).toBe(15000);
    });

    it('should calculate 5% tax correctly', () => {
      expect(calculateTax(100000, 5)).toBe(5000);
    });

    it('should calculate 0% tax correctly', () => {
      expect(calculateTax(100000, 0)).toBe(0);
    });

    it('should round tax to 2 decimal places', () => {
      const tax = calculateTax(33333, 15);
      expect(tax).toBe(4999.95);
    });
  });

  // ─── Payment Recording Tests ──────────────────────────────────────────────

  describe('recordPayment', () => {
    it('should record partial payment and update status to PARTIAL', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        total: 115000,
        paidAmount: 0,
        status: 'SENT',
      });
      mockPrisma.invoice.update.mockImplementation(async (args: any) => ({
        ...testInvoice,
        ...args.data,
      }));

      const result = await invoiceService.recordPayment(testInvoice.id, 50000);

      expect(result.paidAmount).toBe(50000);
      expect(result.status).toBe('PARTIAL');
    });

    it('should update status to PAID when full payment received', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        total: 115000,
        paidAmount: 100000,
        status: 'PARTIAL',
      });
      mockPrisma.invoice.update.mockImplementation(async (args: any) => ({
        ...testInvoice,
        ...args.data,
      }));

      const result = await invoiceService.recordPayment(testInvoice.id, 15000);

      expect(result.paidAmount).toBe(115000);
      expect(result.status).toBe('PAID');
    });

    it('should reject payment exceeding balance', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        total: 115000,
        paidAmount: 100000,
        status: 'PARTIAL',
      });

      await expect(invoiceService.recordPayment(testInvoice.id, 20000))
        .rejects.toThrow('PAYMENT_EXCEEDS_BALANCE');
    });

    it('should reject zero or negative payment', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        total: 115000,
        paidAmount: 0,
        status: 'SENT',
      });

      await expect(invoiceService.recordPayment(testInvoice.id, 0))
        .rejects.toThrow('INVALID_PAYMENT_AMOUNT');

      await expect(invoiceService.recordPayment(testInvoice.id, -100))
        .rejects.toThrow('INVALID_PAYMENT_AMOUNT');
    });

    it('should reject payment on CANCELLED invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        status: 'CANCELLED',
      });

      await expect(invoiceService.recordPayment(testInvoice.id, 50000))
        .rejects.toThrow('CANNOT_RECORD_PAYMENT');
    });

    it('should reject payment on PAID invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        status: 'PAID',
        total: 115000,
        paidAmount: 115000,
      });

      await expect(invoiceService.recordPayment(testInvoice.id, 1000))
        .rejects.toThrow('CANNOT_RECORD_PAYMENT');
    });

    it('should handle exact full payment from SENT status', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        total: 115000,
        paidAmount: 0,
        status: 'SENT',
      });
      mockPrisma.invoice.update.mockImplementation(async (args: any) => ({
        ...testInvoice,
        ...args.data,
      }));

      const result = await invoiceService.recordPayment(testInvoice.id, 115000);

      expect(result.status).toBe('PAID');
      expect(result.paidAmount).toBe(115000);
    });
  });

  // ─── Overdue Detection Tests ──────────────────────────────────────────────

  describe('detectOverdue', () => {
    it('should detect invoices past due date', async () => {
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 10);

      mockPrisma.invoice.findMany.mockResolvedValue([
        { ...testInvoice, status: 'SENT', dueDate: pastDueDate.toISOString().split('T')[0] },
      ]);
      mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'OVERDUE' });

      const count = await invoiceService.detectOverdue();

      expect(count).toBe(1);
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'OVERDUE' },
        })
      );
    });

    it('should not mark DRAFT invoices as overdue', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await invoiceService.detectOverdue();

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['SENT', 'PARTIAL'] },
          }),
        })
      );
    });

    it('should not mark already PAID invoices as overdue', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await invoiceService.detectOverdue();

      const calledWhere = mockPrisma.invoice.findMany.mock.calls[0][0].where;
      expect(calledWhere.status.in).not.toContain('PAID');
    });

    it('should return 0 when no overdue invoices', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const count = await invoiceService.detectOverdue();

      expect(count).toBe(0);
    });

    it('should handle multiple overdue invoices', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'inv1', status: 'SENT', dueDate: '2024-01-01' },
        { id: 'inv2', status: 'PARTIAL', dueDate: '2024-01-15' },
        { id: 'inv3', status: 'SENT', dueDate: '2024-02-01' },
      ]);
      mockPrisma.invoice.update.mockResolvedValue({});

      const count = await invoiceService.detectOverdue();

      expect(count).toBe(3);
      expect(mockPrisma.invoice.update).toHaveBeenCalledTimes(3);
    });
  });

  // ─── Invoice Listing Tests ────────────────────────────────────────────────

  describe('listInvoices', () => {
    it('should return paginated invoice list', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([testInvoice]);
      mockPrisma.invoice.count.mockResolvedValue(1);

      const result = await invoiceService.listInvoices({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter invoices by status', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await invoiceService.listInvoices({ status: 'OVERDUE' });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OVERDUE' }),
        })
      );
    });

    it('should filter invoices by client', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await invoiceService.listInvoices({ clientId: testClientId });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId: testClientId }),
        })
      );
    });

    it('should include related items, project, and client', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([testInvoice]);
      mockPrisma.invoice.count.mockResolvedValue(1);

      await invoiceService.listInvoices();

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            client: true,
            project: true,
            items: true,
          }),
        })
      );
    });
  });

  // ─── Delete Invoice Tests ─────────────────────────────────────────────────

  describe('deleteInvoice', () => {
    it('should delete a DRAFT invoice and its items', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'DRAFT' });
      mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.invoice.delete.mockResolvedValue(testInvoice);

      const result = await invoiceService.deleteInvoice(testInvoice.id);

      expect(result).toEqual(testInvoice);
      expect(mockPrisma.invoiceItem.deleteMany).toHaveBeenCalledWith({
        where: { invoiceId: testInvoice.id },
      });
    });

    it('should throw error when deleting non-DRAFT invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'SENT' });

      await expect(invoiceService.deleteInvoice(testInvoice.id))
        .rejects.toThrow('CAN_ONLY_DELETE_DRAFT');
    });

    it('should throw error when invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(invoiceService.deleteInvoice('nonexistent'))
        .rejects.toThrow('INVOICE_NOT_FOUND');
    });
  });

  // ─── Get Invoice Tests ────────────────────────────────────────────────────

  describe('getInvoiceById', () => {
    it('should return invoice with related entities', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        items: [createTestInvoiceItemData(testInvoice.id)],
        project: { id: testProjectId, name: 'Test Project' },
        client: { id: testClientId, name: 'Test Client' },
      });

      const result = await invoiceService.getInvoiceById(testInvoice.id);

      expect(result.id).toBe(testInvoice.id);
      expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            items: true,
            project: true,
            client: true,
          }),
        })
      );
    });

    it('should throw error for non-existent invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(invoiceService.getInvoiceById('nonexistent'))
        .rejects.toThrow('INVOICE_NOT_FOUND');
    });
  });
});
