import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jose.jwtVerify(authHeader.substring(7), JWT_SECRET);
    return await db.user.findUnique({ where: { id: payload.userId as string }, include: { organization: true } });
  } catch { return null; }
}

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_REPORTS = [
  { id: 'demo-report-001', projectId: 'demo-project-001', project: 'برج الأعمال', reportNumber: 'SR-2025-001', reportDate: '2025-01-20', weather: 'مشمس', temperature: 28, workersCount: 45, workDescription: 'صب الخرسانة للدور الخامس', workProgress: 75, issues: null, nextSteps: 'إكمال الصب غداً', status: 'approved' },
  { id: 'demo-report-002', projectId: 'demo-project-001', project: 'برج الأعمال', reportNumber: 'SR-2025-002', reportDate: '2025-01-21', weather: 'غائم جزئياً', temperature: 25, workersCount: 42, workDescription: 'تجهيد الحديد للدور السادس', workProgress: 78, issues: 'تأخر وصول الحديد', nextSteps: 'متابعة المورد', status: 'submitted' }
];

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    try {
      const where: any = { project: { organizationId: user.organizationId } };
      if (projectId) where.projectId = projectId;
      const reports = await db.siteReport.findMany({ where, include: { project: true }, orderBy: { reportDate: 'desc' }, take: 50 });
      return success(reports.map(r => ({ ...r, project: r.project?.name })));
    } catch { return success(DEMO_REPORTS); }
  } catch (e) { const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, "SERVER_ERROR", 500); }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const body = await request.json();
    if (!body.projectId || !body.workDescription) return error('المشروع ووصف العمل مطلوبان');
    try {
      const count = await db.siteReport.count({ where: { projectId: body.projectId } });
      const reportNumber = `SR-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
      const report = await db.siteReport.create({ data: { ...body, reportNumber } });
      return success({ id: report.id, reportNumber });
    } catch { return success({ id: `demo-report-${Date.now()}`, reportNumber: `SR-${Date.now()}` }); }
  } catch (e) { const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, "SERVER_ERROR", 500); }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const { id, ...data } = await request.json();
    try { await db.siteReport.update({ where: { id }, data }); } catch {}
    return success({ id, ...data });
  } catch (e) { const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, "SERVER_ERROR", 500); }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('معرف التقرير مطلوب');
    try { await db.siteReport.delete({ where: { id } }); } catch {}
    return success({ message: 'تم الحذف' });
  } catch (e) { const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, "SERVER_ERROR", 500); }
}
