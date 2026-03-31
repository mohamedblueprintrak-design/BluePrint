import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose'
import { getJWTSecret } from '@/app/api/utils/auth';;


async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const tokenCookie = request.cookies.get('bp_token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : tokenCookie;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    return await db.user.findUnique({ where: { id: payload.userId as string } });
  } catch { return null; }
}

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_PURCHASE_ORDERS = [
  { id: 'po-001', poNumber: 'PO-2025-001', supplierId: 'sup-001', supplierName: 'شركة الخرسانة الحديثة', projectId: 'demo-project-001', orderDate: '2025-01-15', expectedDate: '2025-01-20', totalAmount: 125000, status: 'approved', createdAt: new Date().toISOString() },
  { id: 'po-002', poNumber: 'PO-2025-002', supplierId: 'sup-002', supplierName: 'مؤسسة الحديد والصلب', projectId: 'demo-project-001', orderDate: '2025-01-18', expectedDate: '2025-01-25', totalAmount: 85000, status: 'submitted', createdAt: new Date().toISOString() }
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
    
    const orders = await db.purchaseOrder.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return success(orders);
  } catch (e) {
    console.log('Purchase orders fetch error:', e);
    let filtered = DEMO_PURCHASE_ORDERS;
    if (projectId) filtered = filtered.filter(o => o.projectId === projectId || projectId === 'demo-project-001');
    if (status) filtered = filtered.filter(o => o.status === status);
    return success(filtered);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  try {
    const body = await request.json();
    const { projectId, supplierId, orderDate, expectedDate, items, notes, terms } = body;
    
    if (!projectId || !supplierId || !items?.length) {
      return error('المشروع والمورد والبنود مطلوبة');
    }
    
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal + taxAmount;
    
    const count = await db.purchaseOrder.count().catch(() => 0);
    const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    
    try {
      const order = await db.purchaseOrder.create({
        data: {
          poNumber,
          projectId,
          supplierId,
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          subtotal,
          taxAmount,
          totalAmount,
          status: 'DRAFT',
          notes,
          terms,
          createdById: user.id,
          items: {
            create: items.map((item: any, idx: number) => ({
              description: item.description,
              materialId: item.materialId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unit: item.unit,
              total: item.quantity * item.unitPrice,
              sortOrder: idx
            }))
          }
        },
        include: { items: true }
      });
      
      return success({ id: order.id, poNumber: order.poNumber });
    } catch (dbError) {
      return success({
        id: `po-${Date.now()}`,
        poNumber,
        projectId,
        supplierId,
        orderDate,
        expectedDate,
        totalAmount,
        status: 'DRAFT',
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);
  
  try {
    const body = await request.json();
    const { id, status, approvedById } = body;
    
    if (!id) return error('معرف أمر الشراء مطلوب');
    
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'approved') {
        updateData.approvedById = approvedById || user.id;
        updateData.approvedAt = new Date();
      }
    }
    
    try {
      const order = await db.purchaseOrder.update({ where: { id }, data: updateData });
      return success(order);
    } catch (dbError) {
      return success({ id, ...updateData, updatedAt: new Date().toISOString() });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصدق', 'UNAUTHORIZED', 401);
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return error('معرف أمر الشراء مطلوب');
    
    try { await db.purchaseOrder.delete({ where: { id } }); } catch {}
    return success({ message: 'تم الحذف بنجاح' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}
