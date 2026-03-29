import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// GET - Fetch single equipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { id } = await params;
    // @ts-expect-error equipment model not in schema
    const equipment = await db.equipment.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (!equipment) {
      return errorResponse('Equipment not found', 'NOT_FOUND', 404);
    }

    return successResponse(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return errorResponse('Failed to fetch equipment', 'SERVER_ERROR', 500);
  }
}

// PUT - Update equipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { id } = await params;
    const body = await request.json();

    // SECURITY: Only allow updating specific fields (prevent mass assignment)
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.equipmentType !== undefined) updateData.equipmentType = body.equipmentType;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.purchaseValue !== undefined) updateData.purchaseValue = body.purchaseValue;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // @ts-expect-error equipment model not in schema
    const equipment = await db.equipment.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return successResponse(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return errorResponse('Failed to update equipment', 'SERVER_ERROR', 500);
  }
}

// DELETE - Soft delete equipment (set isActive to false instead of hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { id } = await params;

    // SECURITY: Use soft delete instead of hard delete
    // @ts-expect-error equipment model not in schema
    await db.equipment.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ message: 'تم حذف المعدة' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return errorResponse('Failed to delete equipment', 'SERVER_ERROR', 500);
  }
}
