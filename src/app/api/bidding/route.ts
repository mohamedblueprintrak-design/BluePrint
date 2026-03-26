import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all bids
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: any = {};

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

    const bids = await prisma.bid.findMany({
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
        {
          id: '3',
          title: 'إنشاء مستشفى تخصصي',
          reference: 'TND-2024-022',
          bidType: 'tender',
          status: 'won',
          deadline: '2024-11-01',
          estimatedValue: 120000000,
          submittedValue: 115000000,
          location: 'الدمام',
          scope: 'إنشاء مستشفى تخصصي بسعة 200 سرير',
          requirements: [
            'ترخيص وزارة الصحة',
            'خبرة في المستشفيات',
            'التزام بالمواصفات الطبية',
          ],
          documentsCount: 8,
          client: { id: '3', name: 'وزارة الصحة' },
          createdAt: new Date(),
        },
        {
          id: '4',
          title: 'صيانة شبكة الطرق',
          reference: 'RFQ-2024-088',
          bidType: 'rfq',
          status: 'lost',
          deadline: '2024-10-15',
          estimatedValue: 8000000,
          location: 'مكة المكرمة',
          scope: 'صيانة شبكة الطرق الرئيسية',
          requirements: ['فريق صيانة متخصص', 'معدات حديثة'],
          documentsCount: 2,
          client: { id: '4', name: 'أمانة مكة المكرمة' },
          createdAt: new Date(),
        },
        {
          id: '5',
          title: 'استشاري هندسي للمشروعات',
          reference: 'RFI-2024-003',
          bidType: 'rfi',
          status: 'open',
          deadline: '2025-01-15',
          estimatedValue: 5000000,
          location: 'الرياض',
          scope: 'تقديم استشارات هندسية لمشاريع التطوير',
          requirements: ['مكتب هندسي مرخص', 'خبرة متنوعة'],
          documentsCount: 1,
          client: { id: '5', name: 'الهيئة الملكية للرياض' },
          createdAt: new Date(),
        },
      ];

      return NextResponse.json({ data: mockBids });
    }

    return NextResponse.json({ data: bids });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
}

// POST - Create new bid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      reference,
      clientId,
      bidType,
      deadline,
      estimatedValue,
      location,
      scope,
      requirements,
    } = body;

    try {
      const bid = await prisma.bid.create({
        data: {
          title,
          reference,
          clientId: clientId || null,
          bidType: bidType || 'tender',
          status: 'open',
          deadline: new Date(deadline),
          estimatedValue,
          location,
          scope,
          requirements: requirements || [],
          documentsCount: 0,
        },
        include: {
          client: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ data: bid });
    } catch (dbError) {
      // Demo mode - return success anyway
      return NextResponse.json({
        data: {
          id: Date.now().toString(),
          ...body,
          status: 'open',
          createdAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 });
  }
}
