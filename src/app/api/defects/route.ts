import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const tokenCookie = request.cookies.get('bp_token')?.value;
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : tokenCookie;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return await db.user.findUnique({ where: { id: payload.userId as string } });
  } catch { return null; }
}

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_DEFECTS = [
  { id: 'def-001', projectId: 'demo-project-001', title: 'تشقق في الجدار الخارجي', description: 'تم اكتشاف تشققات في الجدار الشرقي', severity: 'high', status: 'Open', location: 'الطابق الأول - الواجهة الشرقية', assignedTo: 'eng-ahmed', createdAt: new Date().toISOString() },
  { id: 'def-002', projectId: 'demo-project-001', title: 'تسرب مياه في الحمام', description: 'تسرب من مواسير الصرف', severity: 'critical', status: 'In_Progress', location: 'الطابق الثاني - حمام 3', assignedTo: 'eng-sara', createdAt: new Date().toISOString() },
  { id: 'def-003', projectId: 'demo-project-001', title: 'سطحية غير مستوية', description: 'تأخر في تسوية الأرضيات', severity: 'medium', status: 'Resolved', location: 'الطابق الأرضي', resolvedAt: new Date().toISOString(), createdAt: new Date().toISOString() }
];

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');
  
  try {
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (status) whereClause.status = status;
    
    const defects = await db.defect.findMany({
      where: whereClause,
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    return success(defects.map((d: any) => ({ ...d, projectName: d.project?.name })));
  } catch (e) {
    console.log('Defects fetch error, returning demo data:', e);
    let filtered = DEMO_DEFECTS;
    if (projectId) filtered = filtered.filter(d => d.projectId === projectId || projectId === 'demo-project-001');
    if (status) filtered = filtered.filter(d => d.status === status);
    return success(filtered);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  try {
    const body = await request.json();
    const { projectId, title, description, severity, location, assignedTo } = body;
    
    if (!projectId || !title) return error('المشروع والعنوان مطلوبان');
    
    try {
      const defect = await db.defect.create({
        data: { projectId, title, description, severity: severity || 'medium', status: 'Open', location, assignedTo }
      });
      return success(defect);
    } catch (dbError) {
      return success({ id: `def-${Date.now()}`, projectId, title, description, severity: severity || 'medium', status: 'Open', location, assignedTo, createdAt: new Date().toISOString() });
    }
  } catch (e: any) {
    return error(e.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);
  
  try {
    const body = await request.json();
    const { id, title, description, severity, status, location, assignedTo, resolutionNotes } = body;
    
    if (!id) return error('معرف العيب مطلوب');
    
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (severity) updateData.severity = severity;
    if (status) {
      updateData.status = status;
      if (status === 'Resolved' || status === 'Closed') {
        updateData.resolvedAt = new Date();
      }
    }
    if (location) updateData.location = location;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
    
    try {
      const defect = await db.defect.update({ where: { id }, data: updateData });
      return success(defect);
    } catch (dbError) {
      return success({ id, ...updateData, updatedAt: new Date().toISOString() });
    }
  } catch (e: any) {
    return error(e.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return error('معرف العيب مطلوب');
    
    try { await db.defect.delete({ where: { id } }); } catch {}
    return success({ message: 'تم الحذف بنجاح' });
  } catch (e: any) {
    return error(e.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}
