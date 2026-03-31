/**
 * Invoice Service
 * خدمة الفواتير
 * 
 * Business logic layer for invoice operations
 */

import { db } from '@/lib/db';
import { logAudit } from './audit.service';
import type { Invoice } from '@prisma/client';

/**
 * Invoice filtering options
 */
export interface InvoiceFilters {
  status?: string;
  clientId?: string;
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Pagination parameters
 */
export interface InvoicePaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface InvoicePaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create invoice input
 */
export interface CreateInvoiceInput {
  clientId?: string;
  projectId?: string;
  issueDate?: Date;
  dueDate?: Date;
  subtotal?: number;
  taxRate?: number;
  notes?: string;
}

/**
 * Invoice statistics
 */
export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

/**
 * Invoice Service
 * Handles all business logic related to invoices
 */
class InvoiceService {
  /**
   * Get all invoices with pagination and filtering
   */
  async getInvoices(
    organizationId: string,
    filters?: InvoiceFilters,
    pagination?: InvoicePaginationParams
  ): Promise<InvoicePaginatedResult<Invoice>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.projectId) where.projectId = filters.projectId;

    if (filters?.dateFrom || filters?.dateTo) {
      where.issueDate = {};
      if (filters?.dateFrom) (where.issueDate as Record<string, Date>).gte = filters.dateFrom;
      if (filters?.dateTo) (where.issueDate as Record<string, Date>).lte = filters.dateTo;
    }

    if (filters?.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: pagination?.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
          : { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      db.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string, organizationId: string): Promise<Invoice | null> {
    return db.invoice.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
      },
    });
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 3; attempt++) {
      const count = await db.invoice.count({
        where: {
          organizationId,
          invoiceNumber: { startsWith: `INV-${year}` },
        },
      });
      const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
      // Check if this number already exists (race condition guard)
      const exists = await db.invoice.findUnique({
        where: { invoiceNumber },
      });
      if (!exists) return invoiceNumber;
      // If exists due to concurrent request, retry with next iteration
    }
    // Fallback: use timestamp-based unique number after retries exhausted
    return `INV-${year}-${Date.now()}`;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(
    data: CreateInvoiceInput,
    organizationId: string,
    userId: string
  ): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    const subtotal = data.subtotal || 0;
    const taxRate = data.taxRate || 5;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        projectId: data.projectId,
        issueDate: data.issueDate || new Date(),
        dueDate: data.dueDate,
        subtotal,
        taxRate,
        taxAmount,
        total,
        paidAmount: 0,
        status: 'DRAFT',
        notes: data.notes,
        organizationId,
      },
    });

    await logAudit({
      userId,
      organizationId,
      projectId: data.projectId,
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'create',
      description: `تم إنشاء الفاتورة: ${invoice.invoiceNumber}`,
      newValue: invoice,
    });

    return invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(
    id: string,
    data: Partial<Invoice>,
    organizationId: string,
    userId: string
  ): Promise<Invoice> {
    const oldInvoice = await db.invoice.findFirst({
      where: { id, organizationId },
    });

    if (!oldInvoice) {
      throw new Error('Invoice not found');
    }

    // SECURITY: Explicit field whitelist to prevent Mass Assignment
    const allowedFields = ['clientId', 'projectId', 'issueDate', 'dueDate', 'subtotal', 'taxRate', 'taxAmount', 'total', 'paidAmount', 'status', 'notes'] as const;
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if ((data as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (data as Record<string, unknown>)[field];
      }
    }

    // Recalculate totals if subtotal or tax rate changed
    if (data.subtotal !== undefined || data.taxRate !== undefined) {
      const subtotal = data.subtotal ?? oldInvoice.subtotal;
      const taxRate = data.taxRate ?? oldInvoice.taxRate;
      const taxAmount = subtotal * (taxRate / 100);
      updateData.taxAmount = taxAmount;
      updateData.total = subtotal + taxAmount;
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId,
      organizationId,
      projectId: invoice.projectId || undefined,
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'update',
      description: `تم تحديث الفاتورة: ${invoice.invoiceNumber}`,
      oldValue: oldInvoice,
      newValue: invoice,
    });

    return invoice;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string, organizationId: string, userId: string): Promise<void> {
    const invoice = await db.invoice.findFirst({
      where: { id, organizationId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    await db.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId,
      organizationId,
      projectId: invoice.projectId || undefined,
      entityType: 'invoice',
      entityId: id,
      action: 'delete',
      description: `تم حذف الفاتورة: ${invoice.invoiceNumber}`,
      oldValue: invoice,
    });
  }

  /**
   * Mark invoice as sent
   */
  async markAsSent(id: string, organizationId: string, userId: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: 'SENT' } as any, organizationId, userId);
  }

  /**
   * Record payment
   */
  async recordPayment(
    id: string,
    amount: number,
    organizationId: string,
    userId: string
  ): Promise<Invoice> {
    const invoice = await db.invoice.findFirst({
      where: { id, organizationId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const newPaidAmount = invoice.paidAmount + amount;
    const status = newPaidAmount >= invoice.total ? 'PAID' : 'PARTIAL';

    return this.updateInvoice(
      id,
      { paidAmount: newPaidAmount, status: status as any },
      organizationId,
      userId
    );
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(organizationId: string): Promise<InvoiceStats> {
    const [statusCounts, aggregates] = await Promise.all([
      db.invoice.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true,
        _sum: { total: true, paidAmount: true },
      }),
      db.invoice.aggregate({
        where: { organizationId },
        _sum: { total: true, paidAmount: true },
      }),
    ]);

    const stats: InvoiceStats = {
      total: 0,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      totalAmount: aggregates._sum.total || 0,
      paidAmount: aggregates._sum.paidAmount || 0,
      outstandingAmount: (aggregates._sum.total || 0) - (aggregates._sum.paidAmount || 0),
    };

    // Get overdue count
    stats.overdue = await db.invoice.count({
      where: {
        organizationId,
        status: { notIn: ['PAID', 'DRAFT', 'CANCELLED'] },
        dueDate: { lt: new Date() },
      },
    });

    for (const item of statusCounts) {
      stats.total += item._count;
      switch (item.status) {
        case 'DRAFT':
          stats.draft = item._count;
          break;
        case 'SENT':
          stats.sent = item._count;
          break;
        case 'PAID':
          stats.paid = item._count;
          break;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
