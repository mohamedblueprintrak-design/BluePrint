import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

const success = (data: any, meta?: any) => NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

// Demo BOQ items
const DEMO_BOQ_ITEMS = [
  { id: 'boq-001', projectId: 'demo-project-001', itemNumber: 'C-001', description: 'أعمال الحفر والتسوية', unit: 'م³', quantity: 500, unitPrice: 45, totalPrice: 22500, category: 'civil', createdAt: new Date().toISOString() },
  { id: 'boq-002', projectId: 'demo-project-001', itemNumber: 'C-002', description: 'خرسانة عادية للميدة', unit: 'م³', quantity: 120, unitPrice: 380, totalPrice: 45600, category: 'structural', createdAt: new Date().toISOString() },
  { id: 'boq-003', projectId: 'demo-project-001', itemNumber: 'C-003', description: 'حديد تسليح', unit: 'طن', quantity: 25, unitPrice: 3200, totalPrice: 80000, category: 'structural', createdAt: new Date().toISOString() },
  { id: 'boq-004', projectId: 'demo-project-001', itemNumber: 'M-001', description: 'أعمال البلاط الأرضي', unit: 'م²', quantity: 800, unitPrice: 85, totalPrice: 68000, category: 'finishing', createdAt: new Date().toISOString() },
  { id: 'boq-005', projectId: 'demo-project-001', itemNumber: 'E-001', description: 'تمديدات كهربائية', unit: 'م', quantity: 1500, unitPrice: 25, totalPrice: 37500, category: 'mep', createdAt: new Date().toISOString() },
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    const filteredItems = projectId 
      ? DEMO_BOQ_ITEMS.filter(item => item.projectId === projectId || projectId === 'demo-project-001')
      : DEMO_BOQ_ITEMS;
    return success(filteredItems);
  }
  
  try {
    const { db } = await import('@/lib/db');
    
    const whereClause: any = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    const items = await db.bOQItem.findMany({
      where: whereClause,
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    const mappedItems = items.map((item: any) => ({
      ...item,
      projectName: item.project?.name
    }));
    
    return success(mappedItems);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create BOQ items
  if (isDemoUser(user.id)) {
    return error('لا يمكن إنشاء بنود جدول الكميات في الوضع التجريبي', 'DEMO_MODE', 403);
  }
  
  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { projectId, itemNumber, description, unit, quantity, unitPrice, category, notes } = body;
    
    if (!projectId || !description) {
      return error('المشروع والوصف مطلوبان');
    }
    
    const totalPrice = (quantity || 0) * (unitPrice || 0);
    
    const item = await db.bOQItem.create({
      data: {
        projectId,
        itemNumber: itemNumber || null,
        description,
        unit: unit || null,
        quantity: parseFloat(quantity) || 0,
        unitPrice: parseFloat(unitPrice) || 0,
        totalPrice,
        category: category || null,
        notes: notes || null
      }
    });
    
    return success(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update BOQ items
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث بنود جدول الكميات في الوضع التجريبي', 'DEMO_MODE', 403);
  }
  
  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { id, itemNumber, description, unit, quantity, unitPrice, category, notes } = body;
    
    if (!id) return error('معرف البند مطلوب');
    
    const totalPrice = (quantity || 0) * (unitPrice || 0);
    
    const item = await db.bOQItem.update({
      where: { id },
      data: {
        itemNumber: itemNumber || null,
        description,
        unit: unit || null,
        quantity: parseFloat(quantity) || 0,
        unitPrice: parseFloat(unitPrice) || 0,
        totalPrice,
        category: category || null,
        notes: notes || null
      }
    });
    
    return success(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete BOQ items
  if (isDemoUser(user.id)) {
    return error('لا يمكن حذف بنود جدول الكميات في الوضع التجريبي', 'DEMO_MODE', 403);
  }
  
  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return error('معرف البند مطلوب');
    
    await db.bOQItem.delete({ where: { id } });
    return success({ message: 'تم الحذف بنجاح' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}
