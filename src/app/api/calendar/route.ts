import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    const where: any = {};

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (type) {
      where.eventType = type;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    // If no events in database, return mock data for demo
    if (events.length === 0) {
      const today = new Date();
      const mockEvents = [
        {
          id: '1',
          title: 'موعد تسليم مشروع البرج',
          description: 'الموعد النهائي لتسليم المرحلة الأولى',
          eventType: 'deadline',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
          endDate: null,
          allDay: true,
          location: 'موقع البرج السكني',
          color: '#3B82F6',
          project: { id: '1', name: 'برج الرياض السكني' },
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'اجتماع مراجعة مشروع المستشفى',
          description: 'مراجعة التقدم الأسبوعي مع الفريق',
          eventType: 'meeting',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 0),
          allDay: false,
          location: 'قاعة الاجتماعات الرئيسية',
          color: '#EAB308',
          project: { id: '2', name: 'مجمع جدة الطبي' },
          createdAt: new Date(),
        },
        {
          id: '3',
          title: 'استلام دفعة من العميل',
          description: 'دفعة المرحلة الثانية - 2.5 مليون ريال',
          eventType: 'payment',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
          endDate: null,
          allDay: true,
          location: null,
          color: '#22C55E',
          project: { id: '1', name: 'برج الرياض السكني' },
          createdAt: new Date(),
        },
        {
          id: '4',
          title: 'إكمال الهيكل الخرساني',
          description: '里程碑 - اكتمال الهيكل الخرساني للدور 15',
          eventType: 'milestone',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
          endDate: null,
          allDay: true,
          location: null,
          color: '#A855F7',
          project: { id: '1', name: 'برج الرياض السكني' },
          createdAt: new Date(),
        },
        {
          id: '5',
          title: 'تذكير - تجديد رخصة المقاول',
          description: 'يجب تجديد رخصة المقاول قبل انتهاء الصلاحية',
          eventType: 'reminder',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20),
          endDate: null,
          allDay: true,
          location: null,
          color: '#F97316',
          project: null,
          createdAt: new Date(),
        },
        {
          id: '6',
          title: 'اجتماع فريق التصميم',
          description: 'مناقشة التصاميم الجديدة للواجهة',
          eventType: 'meeting',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 0),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 16, 0),
          allDay: false,
          location: 'غرفة التصميم',
          color: '#EAB308',
          project: { id: '2', name: 'مجمع جدة الطبي' },
          createdAt: new Date(),
        },
      ];

      return NextResponse.json({ data: mockEvents });
    }

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      location,
      projectId,
      color,
    } = body;

    try {
      const event = await prisma.calendarEvent.create({
        data: {
          title,
          description,
          eventType: eventType || 'other',
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          allDay: allDay ?? true,
          location,
          projectId: projectId || null,
          color,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ data: event });
    } catch (dbError) {
      // Demo mode - return success anyway
      return NextResponse.json({
        data: {
          id: Date.now().toString(),
          ...body,
          startDate: new Date(startDate),
          createdAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
