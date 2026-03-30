/**
 * Invoice Items API Route
 * مسار واجهة برمجة التطبيقات لبنود الفاتورة
 *
 * Handles CRUD operations for invoice items with automatic
 * invoice total recalculation on create/update/delete.
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '../utils/response';
import { db } from '@/lib/db';

// ============================================
// Helper: Recalculate Invoice Totals
// ============================================

/**
 * Recalculate subtotal, taxAmount, and total on the parent invoice
 * after any item is created, updated, or deleted.
 */
async function recalculateInvoiceTotals(invoiceId: string) {
  const items = await db.invoiceItem.findMany({ where: { invoiceId } });
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  const taxAmount = subtotal * ((invoice.taxRate || 0) / 100);
  // discountAmount may not exist in the schema – treat as 0 when absent
  const discountAmount = (invoice as Record<string, unknown>).discountAmount
    ? Number((invoice as Record<string, unknown>).discountAmount)
    : 0;
  const total = subtotal + taxAmount - discountAmount;

  await db.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, taxAmount, total },
  });
}

// ============================================
// GET – List invoice items (filter by invoiceId)
// ============================================

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('invoiceId');

  if (!invoiceId) {
    return validationErrorResponse('معرف الفاتورة مطلوب (invoiceId)');
  }

  // Demo mode – return empty for demo users
  if (isDemoUser(user.id)) {
    return successResponse([]);
  }

  try {
    const items = await db.invoiceItem.findMany({
      where: { invoiceId },
      include: {
        boqItem: {
          select: {
            id: true,
            itemNumber: true,
            description: true,
            unit: true,
            category: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(items);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

// ============================================
// POST – Create an invoice item
// ============================================

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Demo mode – cannot create
  if (isDemoUser(user.id)) {
    return errorResponse(
      'لا يمكن إنشاء بنود الفاتورة في الوضع التجريبي',
      'DEMO_MODE',
      403,
    );
  }

  try {
    const body = await request.json();
    const {
      invoiceId,
      description,
      boqItemId,
      quantity = 1,
      unitPrice = 0,
      unit = 'unit',
      notes,
      sortOrder = 0,
    } = body;

    if (!invoiceId || !description) {
      return validationErrorResponse('معرف الفاتورة والوصف مطلوبان');
    }

    const totalPrice = (Number(quantity) || 1) * (Number(unitPrice) || 0);

    const item = await db.invoiceItem.create({
      data: {
        invoiceId,
        description,
        boqItemId: boqItemId || null,
        quantity: Number(quantity) || 1,
        unitPrice: Number(unitPrice) || 0,
        unit: unit || 'unit',
        totalPrice,
        notes: notes || null,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    // Recalculate parent invoice totals
    await recalculateInvoiceTotals(invoiceId);

    return successResponse(item);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

// ============================================
// PUT – Update an invoice item
// ============================================

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Demo mode – cannot update
  if (isDemoUser(user.id)) {
    return errorResponse(
      'لا يمكن تحديث بنود الفاتورة في الوضع التجريبي',
      'DEMO_MODE',
      403,
    );
  }

  try {
    const body = await request.json();
    const { id, description, boqItemId, quantity, unitPrice, unit, notes, sortOrder } = body;

    if (!id) {
      return validationErrorResponse('معرف البند مطلوب');
    }

    // Fetch existing item to know the invoiceId
    const existing = await db.invoiceItem.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('بند الفاتورة غير موجود', 'NOT_FOUND', 404);
    }

    const recalcQuantity = quantity !== undefined ? Number(quantity) : existing.quantity;
    const recalcUnitPrice = unitPrice !== undefined ? Number(unitPrice) : existing.unitPrice;
    const totalPrice = recalcQuantity * recalcUnitPrice;

    const item = await db.invoiceItem.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(boqItemId !== undefined && { boqItemId: boqItemId || null }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
        ...(unit !== undefined && { unit }),
        totalPrice,
        ...(notes !== undefined && { notes: notes || null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    // Recalculate parent invoice totals
    await recalculateInvoiceTotals(existing.invoiceId);

    return successResponse(item);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

// ============================================
// DELETE – Delete an invoice item
// ============================================

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Demo mode – cannot delete
  if (isDemoUser(user.id)) {
    return errorResponse(
      'لا يمكن حذف بنود الفاتورة في الوضع التجريبي',
      'DEMO_MODE',
      403,
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return validationErrorResponse('معرف البند مطلوب');
    }

    // Fetch existing item to know the invoiceId before deletion
    const existing = await db.invoiceItem.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('بند الفاتورة غير موجود', 'NOT_FOUND', 404);
    }

    const invoiceId = existing.invoiceId;

    await db.invoiceItem.delete({ where: { id } });

    // Recalculate parent invoice totals
    await recalculateInvoiceTotals(invoiceId);

    return successResponse({ message: 'تم حذف بند الفاتورة بنجاح' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
