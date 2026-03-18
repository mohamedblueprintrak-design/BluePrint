import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_DOCS = [
  { id: 'demo-doc-001', filename: 'مخطط-البناء.pdf', originalName: 'مخطط البناء', fileType: 'pdf', fileSize: 2456000, category: 'drawings', uploadedBy: 'م. أحمد', createdAt: new Date() },
  { id: 'demo-doc-002', filename: 'عقد-المشروع.docx', originalName: 'عقد المشروع', fileType: 'docx', fileSize: 512000, category: 'contracts', uploadedBy: 'م. محمد', createdAt: new Date() }
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    return success(DEMO_DOCS);
  }

  try {
    const { db } = await import('@/lib/db');
    const docs = await db.document.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    
    const uploaderIds = [...new Set(docs.map(d => d.uploadedBy).filter(Boolean))] as string[];
    const uploaders = await db.user.findMany({ where: { id: { in: uploaderIds } } });
    const uploaderMap = new Map(uploaders.map(u => [u.id, u.fullName || u.username]));
    
    return success(docs.map(d => ({ 
      ...d, 
      uploaderName: d.uploadedBy ? uploaderMap.get(d.uploadedBy) || 'غير معروف' : null 
    })));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create documents
  if (isDemoUser(user.id)) {
    return error('لا يمكن رفع مستندات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const doc = await db.document.create({ data: { ...body, uploadedBy: user.id } });
    return success({ id: doc.id, fileName: doc.fileName });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete documents
  if (isDemoUser(user.id)) {
    return error('لا يمكن حذف المستندات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('معرف المستند مطلوب');
    await db.document.delete({ where: { id } });
    return success({ message: 'تم الحذف' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}
