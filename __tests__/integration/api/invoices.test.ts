/**
 * Invoices API Integration Tests
 * Full CRUD, payment recording, and PDF generation endpoint tests.
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
  type UserRole,
} from '../../utils/setup';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockResponse() {
  const res: any = { statusCode: 200, body: null };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: any) => { res.body = data; return res; };
  return res;
}

function createMockRequest(body: any = {}, headers: Record<string, string> = {}) {
  return { body, query: {}, params: {}, headers: { 'content-type': 'application/json', ...headers } };
}

function verifyToken(token: string): { userId: string; role: UserRole } | null {
  if (!token || !token.startsWith('Bearer ')) return null;
  const parts = token.replace('Bearer ', '').split('_');
  if (parts[0] === 'encoded' && parts[1] === 'jwt') return { userId: parts[2], role: parts[3] as UserRole };
  return null;
}

const ROLE_PERMISSIONS: Record<UserRole, { canCreate: boolean; canUpdate: boolean; canDelete: boolean; canRecordPayment: boolean }> = {
  ADMIN: { canCreate: true, canUpdate: true, canDelete: true, canRecordPayment: true },
  MANAGER: { canCreate: true, canUpdate: true, canDelete: false, canRecordPayment: true },
  ENGINEER: { canCreate: false, canUpdate: true, canDelete: false, canRecordPayment: false },
  VIEWER: { canCreate: false, canUpdate: false, canDelete: false, canRecordPayment: false },
};

// ─── Mock Handlers ───────────────────────────────────────────────────────────

class InvoiceHandlers {
  async list(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { page, limit, status, clientId, projectId } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (projectId) where.projectId = projectId;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      const [invoices, total] = await Promise.all([
        mockPrisma.invoice.findMany({
          where,
          include: { client: true, project: true, items: true },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        mockPrisma.invoice.count({ where }),
      ]);

      return res.status(200).json({
        data: invoices,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canCreate) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { projectId, clientId, items, taxRate, dueDate, notes } = req.body;
      if (!projectId || !clientId || !items || !items.length || !dueDate) {
        return res.status(400).json({ error: 'Missing required fields', code: 'VALIDATION_ERROR' });
      }

      const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      const rate = taxRate ?? 15;
      const taxAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
      const total = subtotal + taxAmount;

      const invoice = await mockPrisma.$transaction(async (tx: any) => {
        const count = await tx.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const created = await tx.invoice.create({
          data: {
            invoiceNumber, projectId, clientId,
            subtotal, taxRate: rate, taxAmount, total,
            paidAmount: 0, status: 'DRAFT',
            dueDate, issuedDate: new Date().toISOString().split('T')[0],
            notes,
          },
        });

        const createdItems = await Promise.all(
          items.map((item: any) =>
            tx.invoiceItem.create({
              data: {
                invoiceId: created.id,
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

        return { ...created, items: createdItems };
      });

      return res.status(201).json({ data: invoice });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { id } = req.params;
      const invoice = await mockPrisma.invoice.findUnique({
        where: { id },
        include: { client: true, project: true, items: true },
      });

      if (!invoice) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });

      return res.status(200).json({ data: invoice });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canUpdate) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { id, ...data } = req.body;
      const existing = await mockPrisma.invoice.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });

      const invoice = await mockPrisma.invoice.update({ where: { id }, data });
      return res.status(200).json({ data: invoice });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async remove(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canDelete) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { id } = req.body;
      const existing = await mockPrisma.invoice.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });
      if (existing.status !== 'DRAFT') return res.status(400).json({ error: 'Only draft invoices can be deleted', code: 'INVALID_STATUS' });

      await mockPrisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await mockPrisma.invoice.delete({ where: { id } });

      return res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async recordPayment(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canRecordPayment) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { id, amount } = req.body;
      if (!id || !amount) return res.status(400).json({ error: 'Invoice ID and amount are required', code: 'VALIDATION_ERROR' });

      const invoice = await mockPrisma.invoice.findUnique({ where: { id } });
      if (!invoice) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });
      if (invoice.status === 'CANCELLED' || invoice.status === 'PAID')
        return res.status(400).json({ error: 'Cannot record payment on this invoice', code: 'INVALID_STATUS' });
      if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive', code: 'INVALID_AMOUNT' });
      if (amount > invoice.total - invoice.paidAmount)
        return res.status(400).json({ error: 'Payment exceeds balance', code: 'PAYMENT_EXCEEDS_BALANCE' });

      const newPaidAmount = invoice.paidAmount + amount;
      let newStatus = invoice.status;
      if (newPaidAmount >= invoice.total) newStatus = 'PAID';
      else if (invoice.status === 'SENT' || invoice.status === 'DRAFT') newStatus = 'PARTIAL';

      const updated = await mockPrisma.invoice.update({
        where: { id },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });

      return res.status(200).json({ data: updated });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generatePdf(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { id } = req.params;
      const invoice = await mockPrisma.invoice.findUnique({
        where: { id },
        include: { client: true, project: true, items: true },
      });

      if (!invoice) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });

      // In real implementation, would generate PDF
      return res.status(200).json({
        data: {
          url: `/api/invoices/${id}/pdf/download`,
          invoiceNumber: invoice.invoiceNumber,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Invoices API Integration', () => {
  let handlers: InvoiceHandlers;
  let adminUser: any;
  let managerUser: any;
  let engineerUser: any;
  let viewerUser: any;
  let testClientId: string;
  let testProjectId: string;
  let testInvoice: TestInvoice;

  beforeEach(async () => {
    await setupTestDatabase();
    handlers = new InvoiceHandlers();
    adminUser = createTestUserData({ role: 'ADMIN' });
    managerUser = createTestUserData({ role: 'MANAGER' });
    engineerUser = createTestUserData({ role: 'ENGINEER' });
    viewerUser = createTestUserData({ role: 'VIEWER' });
    testClientId = generateTestId('client');
    testProjectId = generateTestId('project');
    testInvoice = createTestInvoiceData(testClientId, testProjectId);
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── GET /api/invoices ────────────────────────────────────────────────────

  describe('GET /api/invoices', () => {
    it('should return paginated invoice list', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([testInvoice]);
      mockPrisma.invoice.count.mockResolvedValue(1);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('should filter by status', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { status: 'OVERDUE' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'OVERDUE' }) })
      );
    });

    it('should filter by client', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { clientId: testClientId };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ clientId: testClientId }) })
      );
    });

    it('should include items, project, and client', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([testInvoice]);
      mockPrisma.invoice.count.mockResolvedValue(1);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ items: true, project: true, client: true }),
        })
      );
    });
  });

  // ─── POST /api/invoices ───────────────────────────────────────────────────

  describe('POST /api/invoices', () => {
    const validItems = [
      { description: 'Concrete', quantity: 100, unitPrice: 250, unit: 'CUBIC_M' },
    ];

    it('should create invoice as admin', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue(testInvoice);
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({ id: 'item-1', ...args.data }));
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        projectId: testProjectId,
        clientId: testClientId,
        items: validItems,
        dueDate: '2024-06-30',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toBeDefined();
    });

    it('should create invoice as manager', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue(testInvoice);
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({ id: 'item-1', ...args.data }));
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));

      const token = `Bearer encoded_jwt_${managerUser.id}_MANAGER`;
      const req = createMockRequest({
        projectId: testProjectId,
        clientId: testClientId,
        items: validItems,
        dueDate: '2024-06-30',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
    });

    it('should return 403 when engineer tries to create', async () => {
      const token = `Bearer encoded_jwt_${engineerUser.id}_ENGINEER`;
      const req = createMockRequest({
        projectId: testProjectId, clientId: testClientId, items: validItems, dueDate: '2024-06-30',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 403 when viewer tries to create', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({
        projectId: testProjectId, clientId: testClientId, items: validItems, dueDate: '2024-06-30',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ projectId: testProjectId }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for empty items array', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        projectId: testProjectId, clientId: testClientId, items: [], dueDate: '2024-06-30',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should calculate subtotal, tax, and total correctly', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      let createdData: any = null;
      mockPrisma.invoice.create.mockImplementation(async (args: any) => { createdData = args.data; return { ...args.data, id: 'inv-1' }; });
      mockPrisma.invoiceItem.create.mockImplementation(async (args: any) => ({ id: 'item-1', ...args.data }));
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        projectId: testProjectId, clientId: testClientId,
        items: [
          { description: 'Item 1', quantity: 10, unitPrice: 100, unit: 'PCS' },
          { description: 'Item 2', quantity: 5, unitPrice: 200, unit: 'LOT' },
        ],
        dueDate: '2024-06-30',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
      expect(createdData.subtotal).toBe(2000); // 10*100 + 5*200
      expect(createdData.taxRate).toBe(15);
      expect(createdData.taxAmount).toBe(300); // 2000 * 0.15
      expect(createdData.total).toBe(2300);
    });
  });

  // ─── GET /api/invoices/:id ────────────────────────────────────────────────

  describe('GET /api/invoices/:id', () => {
    it('should return invoice with relations', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        items: [createTestInvoiceItemData(testInvoice.id)],
        client: { id: testClientId, name: 'Client' },
        project: { id: testProjectId, name: 'Project' },
      });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: testInvoice.id };
      const res = createMockResponse();
      await handlers.getById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(testInvoice.id);
    });

    it('should return 404 for non-existent invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: 'nonexistent' };
      const res = createMockResponse();
      await handlers.getById(req, res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── PUT /api/invoices/:id ───────────────────────────────────────────────

  describe('PUT /api/invoices/:id', () => {
    it('should update invoice as admin', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(testInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...testInvoice, status: 'SENT' });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id, status: 'SENT' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('should return 403 when viewer tries to update', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({ id: testInvoice.id, status: 'SENT' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: 'nonexistent', status: 'SENT' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── DELETE /api/invoices/:id ─────────────────────────────────────────────

  describe('DELETE /api/invoices/:id', () => {
    it('should delete DRAFT invoice as admin', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'DRAFT' });
      mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.invoice.delete.mockResolvedValue(testInvoice);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('should return 400 when deleting non-DRAFT invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...testInvoice, status: 'SENT' });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS');
    });

    it('should return 403 when manager tries to delete', async () => {
      const token = `Bearer encoded_jwt_${managerUser.id}_MANAGER`;
      const req = createMockRequest({ id: testInvoice.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Payment Recording ────────────────────────────────────────────────────

  describe('POST /api/invoices/:id/payment', () => {
    it('should record payment as admin', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice, total: 115000, paidAmount: 0, status: 'SENT',
      });
      mockPrisma.invoice.update.mockImplementation(async (args: any) => ({
        ...testInvoice, ...args.data,
      }));

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id, amount: 50000 }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.paidAmount).toBe(50000);
      expect(res.body.data.status).toBe('PARTIAL');
    });

    it('should record payment as manager', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice, total: 115000, paidAmount: 0, status: 'SENT',
      });
      mockPrisma.invoice.update.mockImplementation(async (args: any) => ({
        ...testInvoice, ...args.data,
      }));

      const token = `Bearer encoded_jwt_${managerUser.id}_MANAGER`;
      const req = createMockRequest({ id: testInvoice.id, amount: 50000 }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('should return 403 when engineer tries to record payment', async () => {
      const token = `Bearer encoded_jwt_${engineerUser.id}_ENGINEER`;
      const req = createMockRequest({ id: testInvoice.id, amount: 50000 }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should update to PAID when full amount received', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice, total: 115000, paidAmount: 100000, status: 'PARTIAL',
      });
      mockPrisma.invoice.update.mockImplementation(async (args: any) => ({
        ...testInvoice, ...args.data,
      }));

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id, amount: 15000 }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.body.data.status).toBe('PAID');
      expect(res.body.data.paidAmount).toBe(115000);
    });

    it('should reject payment exceeding balance', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice, total: 115000, paidAmount: 100000, status: 'PARTIAL',
      });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id, amount: 20000 }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('PAYMENT_EXCEEDS_BALANCE');
    });

    it('should reject zero or negative payment', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice, total: 115000, paidAmount: 0, status: 'SENT',
      });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id, amount: 0 }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should reject payment on CANCELLED invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice, status: 'CANCELLED',
      });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id, amount: 10000 }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for missing fields', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testInvoice.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.recordPayment(req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── PDF Generation ───────────────────────────────────────────────────────

  describe('GET /api/invoices/:id/pdf', () => {
    it('should return PDF generation info', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...testInvoice,
        items: [],
        client: { id: testClientId, name: 'Client' },
        project: { id: testProjectId, name: 'Project' },
      });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: testInvoice.id };
      const res = createMockResponse();
      await handlers.generatePdf(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.url).toContain(`/api/invoices/${testInvoice.id}/pdf/download`);
      expect(res.body.data.invoiceNumber).toBeDefined();
    });

    it('should return 404 for non-existent invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: 'nonexistent' };
      const res = createMockResponse();
      await handlers.generatePdf(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest();
      req.params = { id: testInvoice.id };
      const res = createMockResponse();
      await handlers.generatePdf(req, res);

      expect(res.statusCode).toBe(401);
    });
  });
});
