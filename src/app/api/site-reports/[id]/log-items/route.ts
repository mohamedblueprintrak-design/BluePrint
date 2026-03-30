import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/app/api/utils/demo-config';
import { successResponse, unauthorizedResponse, serverErrorResponse, validationErrorResponse, notFoundResponse } from '@/app/api/utils/response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const items = await prisma.siteLogItem.findMany({
      where: { siteReportId: id },
      include: {
        boqItem: { select: { id: true, description: true, category: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return successResponse({
      items: items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
        boqItem: item.boqItem ? {
          id: item.boqItem.id,
          description: item.boqItem.description,
          category: item.boqItem.category,
          unit: item.boqItem.unit,
        } : null,
        createdAt: item.createdAt,
      })),
      totalCost,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { description, quantity, unitPrice, boqItemId, notes } = body;

    if (!description) {
      return validationErrorResponse('Description is required');
    }

    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;

    const item = await prisma.siteLogItem.create({
      data: {
        siteReportId: id,
        description,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price,
        boqItemId: boqItemId || null,
        notes: notes || null,
      },
    });

    // If linked to BOQ, update the actual quantity used
    if (boqItemId) {
      // Optionally reduce BOQ quantity or track separately
      // For now we just record the usage
    }

    return successResponse({
      id: item.id,
      totalPrice: item.totalPrice,
      message: 'Log item added successfully',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { id: itemId, description, quantity, unitPrice, boqItemId, notes } = body;

    if (!itemId) {
      return validationErrorResponse('Item ID is required');
    }

    // Verify the log item belongs to this site report
    const existingItem = await prisma.siteLogItem.findUnique({
      where: { id: itemId },
      select: { siteReportId: true, boqItemId: true, quantity: true, unitPrice: true },
    });

    if (!existingItem || existingItem.siteReportId !== id) {
      return notFoundResponse('Log item not found in this site report');
    }

    const qty = quantity !== undefined ? (parseFloat(quantity) || 0) : undefined;
    const price = unitPrice !== undefined ? (parseFloat(unitPrice) || 0) : undefined;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (description !== undefined) updateData.description = description;
    if (qty !== undefined) updateData.quantity = qty;
    if (price !== undefined) updateData.unitPrice = price;
    if (notes !== undefined) updateData.notes = notes || null;
    if (boqItemId !== undefined) updateData.boqItemId = boqItemId || null;

    // Recalculate totalPrice using final values
    const finalQty = qty !== undefined ? qty : existingItem.quantity;
    const finalPrice = price !== undefined ? price : existingItem.unitPrice;
    if (qty !== undefined || price !== undefined) {
      updateData.totalPrice = finalQty * finalPrice;
    }

    const item = await prisma.siteLogItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        boqItem: { select: { id: true, description: true, category: true, unit: true } },
      },
    });

    // Track BOQ link/unlink events
    const boqChanged = boqItemId !== undefined && existingItem.boqItemId !== (boqItemId || null);
    const eventMessage = boqChanged
      ? (boqItemId ? 'Log item linked to BOQ item' : 'Log item unlinked from BOQ item')
      : 'Log item updated';

    return successResponse({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      notes: item.notes,
      boqItem: item.boqItem ? {
        id: item.boqItem.id,
        description: item.boqItem.description,
        category: item.boqItem.category,
        unit: item.boqItem.unit,
      } : null,
      boqChanged,
      event: eventMessage,
      message: 'Log item updated successfully',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return validationErrorResponse('Item ID is required as query parameter');
    }

    // Verify the log item belongs to this site report
    const existingItem = await prisma.siteLogItem.findUnique({
      where: { id: itemId },
      select: { siteReportId: true, description: true },
    });

    if (!existingItem || existingItem.siteReportId !== id) {
      return notFoundResponse('Log item not found in this site report');
    }

    await prisma.siteLogItem.delete({
      where: { id: itemId },
    });

    return successResponse({
      id: itemId,
      message: 'Log item deleted successfully',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
