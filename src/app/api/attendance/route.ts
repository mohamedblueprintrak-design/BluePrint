import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_ATTENDANCE = [
  { id: 'demo-att-001', userId: 'demo-user-001', user: { id: 'demo-user-001', fullName: 'م. أحمد محمد' }, date: new Date(), checkIn: '08:00', checkOut: '17:00', status: 'present', workHours: 9, overtimeHours: 0 },
  { id: 'demo-att-002', userId: 'demo-user-002', user: { id: 'demo-user-002', fullName: 'م. سعيد علي' }, date: new Date(), checkIn: '08:15', checkOut: '17:30', status: 'late', workHours: 9.25, overtimeHours: 0.5 }
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let data = [...DEMO_ATTENDANCE];
    if (userId) data = data.filter(a => a.userId === userId);
    return success(data);
  }

  try {
    const { db } = await import('@/lib/db');
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate) where.date = { gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    const attendance = await db.attendance.findMany({ where, orderBy: { date: 'desc' } });
    
    const userIds = [...new Set(attendance.map(a => a.userId))];
    const users = await db.user.findMany({ where: { id: { in: userIds } } });
    const userMap = new Map(users.map(u => [u.id, { id: u.id, fullName: u.fullName || u.username }]));
    
    return success(attendance.map(a => ({ ...a, user: userMap.get(a.userId) || { id: a.userId, fullName: 'غير معروف' } })));
  } catch (e: any) {
    return error(e.message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create attendance
  if (isDemoUser(user.id)) {
    return error('لا يمكن تسجيل الحضور في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const att = await db.attendance.create({ data: { ...body, userId: body.userId || user.id } });
    return success({ id: att.id, date: att.date });
  } catch (e: any) {
    return error(e.message, 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update attendance
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث سجلات الحضور في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { id, ...data } = await request.json();
    await db.attendance.update({ where: { id }, data });
    return success({ id, ...data });
  } catch (e: any) {
    return error(e.message, 'SERVER_ERROR', 500);
  }
}
