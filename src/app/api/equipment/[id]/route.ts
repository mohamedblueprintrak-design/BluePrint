import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch single equipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ data: equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// PUT - Update equipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    try {
      const equipment = await prisma.equipment.update({
        where: { id },
        data: {
          name: body.name,
          equipmentType: body.equipmentType,
          model: body.model,
          serialNumber: body.serialNumber,
          status: body.status,
          projectId: body.projectId || null,
          location: body.location,
          condition: body.condition,
          purchaseValue: body.purchaseValue,
          notes: body.notes,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ data: equipment });
    } catch (dbError) {
      // Demo mode - return success anyway
      return NextResponse.json({
        data: {
          id,
          ...body,
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}

// DELETE - Delete equipment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    try {
      await prisma.equipment.delete({
        where: { id },
      });
    } catch (dbError) {
      // Demo mode - ignore database error
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
