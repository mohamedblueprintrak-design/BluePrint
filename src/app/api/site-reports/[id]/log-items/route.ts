import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/app/api/utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, validationErrorResponse } from '@/app/api/utils/response';
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
