import { NextRequest } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';
import { successResponse, errorResponse } from '../utils/response';

const DEMO_DOCS = [
  { id: 'demo-doc-001', filename: 'مخطط-البناء.pdf', originalName: 'مخطط البناء', fileType: 'pdf', fileSize: 2456000, category: 'drawings', uploadedBy: 'م. أحمد', createdAt: new Date() },
  { id: 'demo-doc-002', filename: 'عقد-المشروع.docx', originalName: 'عقد المشروع', fileType: 'docx', fileSize: 512000, category: 'contracts', uploadedBy: 'م. محمد', createdAt: new Date() }
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    return successResponse(DEMO_DOCS);
  }

  try {
    const { db } = await import('@/lib/db');
    // SECURITY: Filter documents by organization via uploader's organization
    const orgUserIds = await db.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true }
    }).then(users => users.map(u => u.id));

    const where: Record<string, unknown> = {};
    if (orgUserIds.length > 0) {
      where.uploadedBy = { in: orgUserIds };
    }
    const docs = await db.document.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
    
    const uploaderIds = [...new Set(docs.map(d => d.uploadedBy).filter(Boolean))] as string[];
    const uploaders = await db.user.findMany({ where: { id: { in: uploaderIds } } });
    const uploaderMap = new Map(uploaders.map(u => [u.id, u.fullName || u.username]));
    
    return successResponse(docs.map(d => ({ 
      ...d, 
      uploaderName: d.uploadedBy ? uploaderMap.get(d.uploadedBy) || 'غير معروف' : null 
    })));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create documents
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن رفع مستندات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json() as Record<string, unknown>;
    // SECURITY: Only allow specific fields (prevent mass assignment)
    const docData: Record<string, unknown> = {
      fileName: body.fileName || null,
      originalName: body.originalName || null,
      fileType: body.fileType || null,
      fileSize: body.fileSize || null,
      category: body.category || null,
      projectId: body.projectId || null,
      uploadedBy: user.id,
    };
    const doc = await db.document.create({ data: docData as any });
    return successResponse({ id: doc.id, fileName: doc.fileName });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete documents
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف المستندات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return errorResponse('معرف المستند مطلوب');
    await db.document.delete({ where: { id } });
    return successResponse({ message: 'تم الحذف' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}
