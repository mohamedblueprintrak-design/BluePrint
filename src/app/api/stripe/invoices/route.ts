/**
 * API Route: Stripe Invoices
 * مسار الفواتير Stripe
 * 
 * GET - List or retrieve invoices
 * POST - Create invoice
 * PUT - Pay or finalize invoice
 * DELETE - Void invoice
 */

import { NextRequest} from 'next/server';
import {
  listInvoices,
  retrieveInvoice,
  createInvoice,
  finalizeInvoice,
  payInvoice,
  voidInvoice,
  isStripeConfigured,
} from '@/lib/stripe';
import { successResponse, errorResponse } from '../../utils/response';

/**
 * GET - List or retrieve invoices
 */
export async function GET(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const invoiceId = searchParams.get('invoiceId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Retrieve single invoice
    if (invoiceId) {
      const invoice = await retrieveInvoice(invoiceId);

      if (!invoice) {
        return errorResponse('الفاتورة غير موجودة', 'INVOICE_NOT_FOUND', 404);
      }

      return successResponse({
        invoice: formatInvoice(invoice),
      });
    }

    // List invoices
    if (!customerId) {
      return errorResponse('معرف العميل مطلوب', 'MISSING_CUSTOMER_ID', 400);
    }

    const invoices = await listInvoices(customerId, limit);

    if (!invoices) {
      return errorResponse('فشل في استرجاع الفواتير', 'INVOICES_ERROR', 500);
    }

    return successResponse({
      invoices: invoices.map(formatInvoice),
    });
  } catch (error) {
    console.error('Invoices retrieval error:', error);
    return errorResponse(
      'حدث خطأ أثناء استرجاع الفواتير',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * POST - Create invoice
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  try {
    const body = await request.json();
    const { customerId, description, metadata, autoFinalize = false } = body;

    if (!customerId) {
      return errorResponse('معرف العميل مطلوب', 'MISSING_CUSTOMER_ID', 400);
    }

    const invoice = await createInvoice({
      customerId,
      description,
      metadata,
    });

    if (!invoice) {
      return errorResponse('فشل في إنشاء الفاتورة', 'INVOICE_CREATE_ERROR', 500);
    }

    // Auto-finalize if requested
    if (autoFinalize) {
      await finalizeInvoice(invoice.id);
    }

    return successResponse({
      invoice: formatInvoice(invoice),
      message: 'تم إنشاء الفاتورة بنجاح',
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return errorResponse(
      'حدث خطأ أثناء إنشاء الفاتورة',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * PUT - Pay or finalize invoice
 */
export async function PUT(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  try {
    const body = await request.json();
    const { invoiceId, action } = body;

    if (!invoiceId) {
      return errorResponse('معرف الفاتورة مطلوب', 'MISSING_INVOICE_ID', 400);
    }

    let invoice;

    if (action === 'finalize') {
      invoice = await finalizeInvoice(invoiceId);
      if (!invoice) {
        return errorResponse('فشل في تأكيد الفاتورة', 'FINALIZE_ERROR', 500);
      }
      return successResponse({
        invoice: formatInvoice(invoice),
        message: 'تم تأكيد الفاتورة',
      });
    }

    if (action === 'pay') {
      invoice = await payInvoice(invoiceId);
      if (!invoice) {
        return errorResponse('فشل في دفع الفاتورة', 'PAY_ERROR', 500);
      }
      return successResponse({
        invoice: formatInvoice(invoice),
        message: 'تم دفع الفاتورة بنجاح',
      });
    }

    return errorResponse('إجراء غير صحيح', 'INVALID_ACTION', 400);
  } catch (error) {
    console.error('Invoice action error:', error);
    return errorResponse(
      'حدث خطأ أثناء معالجة الفاتورة',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * DELETE - Void invoice
 */
export async function DELETE(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return errorResponse('معرف الفاتورة مطلوب', 'MISSING_INVOICE_ID', 400);
    }

    const invoice = await voidInvoice(invoiceId);

    if (!invoice) {
      return errorResponse('فشل في إلغاء الفاتورة', 'VOID_ERROR', 500);
    }

    return successResponse({
      message: 'تم إلغاء الفاتورة بنجاح',
    });
  } catch (error) {
    console.error('Void invoice error:', error);
    return errorResponse(
      'حدث خطأ أثناء إلغاء الفاتورة',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * Format invoice for API response
 */
function formatInvoice(invoice: any): Record<string, unknown> {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    amountPaid: invoice.amount_paid / 100,
    amountDue: invoice.amount_due / 100,
    currency: invoice.currency?.toUpperCase(),
    createdAt: invoice.created ? new Date(invoice.created * 1000) : null,
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    paidAt: invoice.status_transitions?.paid_at 
      ? new Date(invoice.status_transitions.paid_at * 1000) 
      : null,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    invoicePdf: invoice.invoice_pdf,
  };
}
