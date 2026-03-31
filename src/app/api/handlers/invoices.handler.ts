import { NextResponse } from 'next/server';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response';
import { getDb } from '../utils/db';
import { 
  parsePaginationParams, 
  isPaginationRequested, 
  buildPaginationMeta, 
  calculateSkip, 
  getEffectiveLimit 
} from '../utils/pagination';

/** Invoice row with client/project relations */
interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  client?: { name?: string } | null;
  clientId?: string;
  project?: { name?: string } | null;
  projectId?: string;
  total?: number;
  paidAmount?: number;
  status: string;
  issueDate?: unknown;
  dueDate?: unknown;
  createdAt: unknown;
}

/** Payment row from database */
interface PaymentRow {
  id: string;
  invoiceId: string;
  amount?: number;
  paymentDate?: unknown;
  paymentMethod?: string;
  referenceNumber?: unknown;
  notes?: unknown;
  createdAt: unknown;
}

/** Invoice row from database for payment processing */
interface InvoicePaymentRow {
  id: string;
  paidAmount?: number;
  total?: number;
  status: string;
  projectId?: string;
}

/** Transaction client interface for invoice payment processing */
interface PaymentTransactionClient {
  invoice: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<InvoicePaymentRow | null>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
  };
  payment: {
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; amount?: number }>;
  };
}

/**
 * GET handlers for invoices actions
 */
export const getHandlers = {
  /**
   * Get all invoices with pagination
   */
  invoices: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const database = await getDb();
    if (!database) {
      return successResponse([], { 
        page: 1, 
        limit: 20, 
        total: 0, 
        totalPages: 0, 
        hasNextPage: false, 
        hasPrevPage: false 
      });
    }
    
    const pagination = parsePaginationParams(context.searchParams);
    const usePagination = isPaginationRequested(context.searchParams);
    
    // Build where clause with search
    const invoiceWhere: Record<string, unknown> = { organizationId: context.user.organizationId };
    if (pagination.search) {
      invoiceWhere.OR = [
        { invoiceNumber: { contains: pagination.search, mode: 'insensitive' } },
        { client: { name: { contains: pagination.search, mode: 'insensitive' } } },
        { project: { name: { contains: pagination.search, mode: 'insensitive' } } }
      ];
    }
    
    // Get total count
    const totalInvoices = await database.invoice.count({ where: invoiceWhere });
    
    // Determine limit based on pagination request
    const invoiceLimit = getEffectiveLimit(usePagination, pagination.limit);
    const invoiceSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    const invoices = await database.invoice.findMany({
      where: invoiceWhere,
      include: { client: true, project: true },
      orderBy: { createdAt: 'desc' },
      skip: invoiceSkip,
      take: invoiceLimit
    });
    
    const mappedInvoices = invoices.map((i: InvoiceRow) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      client: i.client?.name,
      clientId: i.clientId,
      project: i.project?.name,
      projectId: i.projectId,
      total: i.total,
      paidAmount: i.paidAmount,
      status: i.status,
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      createdAt: i.createdAt
    }));
    
    if (usePagination) {
      return successResponse(mappedInvoices, buildPaginationMeta(pagination.page, pagination.limit, totalInvoices));
    }
    return successResponse(mappedInvoices);
  },

  /**
   * Get payments for an invoice
   */
  payments: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const invoiceId = context.searchParams.get('invoiceId');
    if (!invoiceId) return errorResponse('معرف الفاتورة مطلوب');
    
    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify invoice belongs to user's organization
    const invoice = await database.invoice.findFirst({
      where: { id: invoiceId, organizationId: context.user.organizationId }
    });
    if (!invoice) return notFoundResponse('الفاتورة غير موجودة');
    
    const payments = await database.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' }
    });
    
    return successResponse(payments.map((p: PaymentRow) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      amount: p.amount,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      notes: p.notes,
      createdAt: p.createdAt
    })));
  }
};

/**
 * POST handlers for invoices actions
 */
export const postHandlers = {
  /**
   * Create new invoice
   */
  invoice: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { clientId, projectId, items, subtotal, taxRate = 5, discountAmount = 0, dueDate, notes, terms } = (context.body || {}) as Record<string, unknown>;

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    const count = await database.invoice.count({ where: { organizationId: context.user.organizationId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    
    const taxAmount = ((subtotal as number) || 0) * ((taxRate as number) || 5) / 100;
    const total = ((subtotal as number) || 0) + taxAmount - ((discountAmount as number) || 0);

    const invoice = await database.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        projectId,
        items: JSON.stringify(items || []),
        subtotal: (subtotal as number) || 0,
        taxRate: (taxRate as number) || 5,
        taxAmount,
        discountAmount: (discountAmount as number) || 0,
        total,
        dueDate: dueDate ? new Date(dueDate as string) : null,
        notes: notes as string,
        terms: terms as string,
        issueDate: new Date(),
        organizationId: context.user.organizationId
      }
    });

    return successResponse({ id: invoice.id, invoiceNumber, total });
  },

  /**
   * Create payment for invoice
   */
  payment: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, notes } = (context.body || {}) as Record<string, unknown>;
    if (!invoiceId || !amount) {
      return errorResponse('الفاتورة والمبلغ مطلوبان');
    }

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    const orgId = context.user.organizationId;

    // Verify invoice belongs to user's organization and record payment atomically
    let result;
    try {
      result = await database.$transaction(async (tx: PaymentTransactionClient) => {
        const paymentInvoice = await tx.invoice.findFirst({
          where: { id: invoiceId as string, organizationId: orgId }
        });
        if (!paymentInvoice) throw new Error('Invoice not found');

        const payment = await tx.payment.create({
          data: {
            invoiceId: invoiceId as string,
            amount: parseFloat(amount as string),
            paymentDate: paymentDate ? new Date(paymentDate as string) : new Date(),
            paymentMethod: (paymentMethod as string) || 'bank_transfer',
            referenceNumber: referenceNumber as string,
            notes: notes as string
          }
        });

        // Update invoice paidAmount within the transaction
        const newPaidAmount = (paymentInvoice.paidAmount || 0) + parseFloat(amount as string);
        const newStatus = newPaidAmount >= (paymentInvoice.total || 0) ? 'paid' : 
                          newPaidAmount > 0 ? 'partial' : paymentInvoice.status;
        
        await tx.invoice.update({
          where: { id: invoiceId as string },
          data: { 
            paidAmount: newPaidAmount,
            status: newStatus
          }
        });

        return payment;
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return notFoundResponse('الفاتورة غير موجودة');
      }
      return errorResponse('حدث خطأ أثناء معالجة الدفع');
    }

    // After payment is created, update project remaining balance
    const invoice = await database.invoice.findUnique({
      where: { id: invoiceId as string },
      select: { projectId: true, total: true }
    });

    if (invoice?.projectId) {
      // Calculate total payments received for this project
      const paidInvoices = await database.invoice.findMany({
        where: { 
          projectId: invoice.projectId,
          status: { in: ['PAID', 'PARTIAL', 'SENT'] }
        },
        select: { paidAmount: true }
      });
      
      const totalPayments = paidInvoices.reduce((sum: number, inv: InvoiceRow) => sum + (inv.paidAmount || 0), 0);
      
      const project = await database.project.findUnique({
        where: { id: invoice.projectId },
        select: { contractValue: true }
      });
      
      if (project) {
        await database.project.update({
          where: { id: invoice.projectId },
          data: {
            paymentReceived: totalPayments,
            remainingBalance: (project.contractValue || 0) - totalPayments
          }
        });
      }
    }

    return successResponse({ id: result.id, amount: result.amount });
  }
};

/**
 * PUT handlers for invoices actions
 */
export const putHandlers = {
  /**
   * Update invoice status
   */
  'invoice-status': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { id, status } = (context.body || {}) as Record<string, unknown>;
    if (!id || !status) return errorResponse('المعرف والحالة مطلوبان');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify invoice belongs to user's organization
    const invoice = await database.invoice.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!invoice) return notFoundResponse('الفاتورة غير موجودة');

    await database.invoice.update({ where: { id: id as string }, data: { status: status as string } });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for invoices actions
 */
export const deleteHandlers = {
  /**
   * Delete invoice
   */
  invoice: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف الفاتورة مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify invoice belongs to user's organization
    const invoice = await database.invoice.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!invoice) return notFoundResponse('الفاتورة غير موجودة');
    
    await database.invoice.delete({ where: { id } });
    return successResponse(true);
  }
};
