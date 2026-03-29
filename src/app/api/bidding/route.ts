import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// GET - Fetch all bids
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    // SECURITY: Filter by organization through client if available
    if (user.organizationId) {
      where.client = { organizationId: user.organizationId };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.bidType = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const bids = await db.bid.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no bids in database, return mock data for demo
    if (bids.length === 0) {
      const mockBids = [
        {
          id: '1',
          title: 'مشروع إنشاء برج سكني',
          reference: 'TND-2024-001',
          bidType: 'tender',
          status: 'open',
          deadline: '2024-12-30',
          estimatedValue: 50000000,
          location: 'الرياض',
          scope: 'إنشاء برج سكني مكون من 25 طابق مع جميع المرافق',
          requirements: [
            'خبرة لا تقل عن 10 سنوات في المشاريع المشابهة',
            'فريق هندسي مؤهل',
            'التزام بالجدول الزمني',
          ],
          documentsCount: 5,
          client: { id: '1', name: 'وزارة الإسكان' },
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'تطوير مجمع تجاري',
          reference: 'RFP-2024-015',
          bidType: 'rfp',
          status: 'submitted',
          deadline: '2024-12-15',
          estimatedValue: 30000000,
          location: 'جدة',
          scope: 'تطوير مجمع تجاري متكامل مع مواقف سيارات',
          requirements: ['تصميم معماري حديث', 'دراسة جدوى اقتصادية'],
          documentsCount: 3,
          client: { id: '2', name: 'شركة التطوير العقاري' },
          createdAt: new Date(),
        },
      ];

      return successResponse(mockBids);
    }

    return successResponse(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    return errorResponse('Failed to fetch bids', 'SERVER_ERROR', 500);
  }
}

// POST - Create new bid
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const body = await request.json();
    if (!body.title || !body.reference) {
      return errorResponse('العنوان والمرجع مطلوبان', 'VALIDATION_ERROR');
    }

    // SECURITY: Only allow specific fields (prevent mass assignment)
    const bidData: Record<string, unknown> = {
      title: body.title,
      reference: body.reference,
      clientId: body.clientId || null,
      bidType: body.bidType || 'tender',
      status: 'open',
      deadline: body.deadline ? new Date(body.deadline) : null,
      estimatedValue: body.estimatedValue || null,
      location: body.location || null,
      scope: body.scope || null,
      requirements: body.requirements || [],
      documentsCount: 0,
    };

    const bid = await db.bid.create({
      data: bidData,
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return successResponse(bid);
  } catch (error) {
    console.error('Error creating bid:', error);
    return errorResponse('Failed to create bid', 'SERVER_ERROR', 500);
  }
}
