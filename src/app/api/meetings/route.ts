import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';

const success = (data: unknown) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let meetings = [...DEMO_DATA.meetings];
    if (status) meetings = meetings.filter((m: any) => m.status === status);
    return success(meetings.map((m: any) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      time: m.time,
      duration: m.duration,
      location: m.location,
      type: m.type,
      status: m.status,
      attendees: m.attendees,
      agenda: m.agenda,
      notes: m.notes,
      projectId: m.projectId,
      projectName: m.projectName,
      createdAt: m.createdAt,
    })));
  }

  try {
    const { db } = await import('@/lib/db');

    const whereClause: Record<string, unknown> = { organizationId: user.organizationId };
    if (status) (whereClause as Record<string, string>).status = status;

    const meetings = await db.meeting.findMany({
      where: whereClause,
      include: { project: { select: { name: true } } },
      orderBy: { date: 'desc' as const },
    });

    return success(meetings.map((m: any) => ({
      id: m.id,
      title: m.title,
      date: m.date.toISOString().split('T')[0],
      time: m.time,
      duration: m.duration,
      location: m.location,
      type: m.type,
      status: m.status,
      attendees: m.attendees,
      agenda: m.agenda,
      notes: m.notes,
      projectId: m.projectId,
      projectName: m.project?.name,
      createdAt: m.createdAt,
    })));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create meetings
  if (isDemoUser(user.id)) {
    return error('لا يمكن إنشاء اجتماعات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { title, date, time, duration, location, type, attendees, agenda, notes, projectId } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return error('عنوان الاجتماع مطلوب');
    }
    if (!date) {
      return error('تاريخ الاجتماع مطلوب');
    }
    if (!time) {
      return error('وقت الاجتماع مطلوب');
    }

    // Validate type if provided
    const validTypes = ['ONLINE', 'ONSITE'];

    const meeting = await db.meeting.create({
      data: {
        title: title.trim(),
        date: new Date(date),
        time: time,
        duration: duration ? Number(duration) : 60,
        location: location || '',
        type: validTypes.includes(type) ? type : 'ONLINE',
        status: 'PENDING',
        attendees: attendees ? (typeof attendees === 'string' ? attendees : JSON.stringify(attendees)) : null,
        agenda: agenda || null,
        notes: notes || null,
        projectId: projectId || null,
        createdById: user.id,
        organizationId: user.organizationId,
      },
    });

    return success(meeting);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update meetings
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث الاجتماعات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { id, title, date, time, duration, location, type, status, attendees, agenda, notes } = body;

    if (!id) return error('معرف الاجتماع مطلوب');

    // Verify meeting belongs to user's organization
    const existingMeeting = await db.meeting.findUnique({ where: { id } });
    if (!existingMeeting || existingMeeting.organizationId !== user.organizationId) {
      return error('الاجتماع غير موجود', 'NOT_FOUND', 404);
    }

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (duration !== undefined) updateData.duration = Number(duration);
    if (location) updateData.location = location;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (attendees !== undefined) {
      updateData.attendees = typeof attendees === 'string' ? attendees : JSON.stringify(attendees);
    }
    if (agenda !== undefined) updateData.agenda = agenda;
    if (notes !== undefined) updateData.notes = notes;

    const meeting = await db.meeting.update({ where: { id }, data: updateData });
    return success(meeting);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete meetings
  if (isDemoUser(user.id)) {
    return error('لا يمكن حذف الاجتماعات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return error('معرف الاجتماع مطلوب');

    // Verify meeting belongs to user's organization
    const existingMeeting = await db.meeting.findUnique({ where: { id } });
    if (!existingMeeting || existingMeeting.organizationId !== user.organizationId) {
      return error('الاجتماع غير موجود', 'NOT_FOUND', 404);
    }

    await db.meeting.delete({ where: { id } });
    return success({ message: 'تم حذف الاجتماع' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}
