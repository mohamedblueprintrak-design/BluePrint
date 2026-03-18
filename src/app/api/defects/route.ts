import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');
  
  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let filtered = [...DEMO_DATA.defects];
    if (projectId) filtered = filtered.filter(d => d.projectId === projectId);
    if (status) filtered = filtered.filter(d => d.status === status);
    return success(filtered.map(d => ({
      id: d.id,
      projectId: d.projectId,
      title: d.title,
      description: d.description || '',
      severity: d.severity,
      status: d.status,
      createdAt: new Date().toISOString()
    })));
  }
  
  try {
    const { db } = await import('@/lib/db');
    
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (status) whereClause.status = status;
    
    const defects = await db.defect.findMany({
      where: whereClause,
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    return success(defects.map((d: any) => ({ ...d, projectName: d.project?.name })));
  } catch (e: any) {
    return error(e.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  // Demo mode - cannot create defects
  if (isDemoUser(user.id)) {
    return error('لا يمكن إنشاء عيوب في الوضع التجريبي', 'DEMO_MODE', 403);
  }
  
  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { projectId, title, description, severity, location, assignedTo } = body;
    
    if (!projectId || !title) return error('المشروع والعنوان مطلوبان');
    
    const defect = await db.defect.create({
      data: { projectId, title, description, severity: severity || 'medium', status: 'Open', location, assignedTo }
    });
    return success(defect);
  } catch (e: any) {
    return error(e.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);
  
  // Demo mode - cannot update defects
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث العيوب في الوضع التجريبي', 'DEMO_MODE', 403);
  }
  
  try {
    const { db } = await import('@/lib/db');
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
    
    const defect = await db.defect.update({ where: { id }, data: updateData });
    return success(defect);
  } catch (e: any) {
    return error(e.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);
  
  // Demo mode - cannot delete defects
  if (isDemoUser(user.id)) {
    return error('لا يمكن حذف العيوب في الوضع التجريبي', 'DEMO_MODE', 403);
  }
  
  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return error('معرف العيب مطلوب');
    
    await db.defect.delete({ where: { id } });
    return success({ message: 'تم الحذف بنجاح' });
  } catch (e: any) {
    return error(e.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}
