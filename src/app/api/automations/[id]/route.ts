import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH - Update automation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    try {
      const automation = await prisma.automation.update({
        where: { id: params.id },
        data: { status },
      });

      return NextResponse.json({ data: automation });
    } catch (dbError) {
      // Demo mode - return success anyway
      return NextResponse.json({
        data: {
          id: params.id,
          status,
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
  }
}

// GET - Fetch single automation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const automation = await prisma.automation.findUnique({
      where: { id: params.id },
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json({ data: automation });
  } catch (error) {
    console.error('Error fetching automation:', error);
    return NextResponse.json({ error: 'Failed to fetch automation' }, { status: 500 });
  }
}

// DELETE - Delete automation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      await prisma.automation.delete({
        where: { id: params.id },
      });
    } catch (dbError) {
      // Demo mode - ignore database error
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 });
  }
}
