import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// PATCH - Update bid status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { id } = await params;
    const body = await request.json();

    // SECURITY: Only allow updating specific fields
    const validStatuses = ['open', 'submitted', 'won', 'lost', 'cancelled'];
    const status = body.status;
    if (!status || !validStatuses.includes(status)) {
      return errorResponse('حالة العطاء غير صالحة', 'VALIDATION_ERROR');
    }

    const bid = await db.bid.update({
      where: { id },
      data: { status },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return successResponse(bid);
  } catch (error) {
    console.error('Error updating bid:', error);
    return errorResponse('Failed to update bid', 'SERVER_ERROR', 500);
  }
}

// GET - Fetch single bid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { id } = await params;
    const bid = await db.bid.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    if (!bid) {
      return errorResponse('Bid not found', 'NOT_FOUND', 404);
    }

    return successResponse(bid);
  } catch (error) {
    console.error('Error fetching bid:', error);
    return errorResponse('Failed to fetch bid', 'SERVER_ERROR', 500);
  }
}
