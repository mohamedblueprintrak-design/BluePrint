import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = "ERROR", status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_EXPENSES = [
  { id: 'demo-exp-001', projectId: 'demo-project-001', project: 'برج الأعمال', category: 'مواد', description: 'شراء حديد تسليح', amount: 50000, expenseDate: new Date(), paidTo: 'شركة الحديد المتحدة', status: 'approved', createdAt: new Date() },
  { id: 'demo-exp-002', projectId: 'demo-project-001', project: 'برج الأعمال', category: 'عمالة', description: 'رواتب العمال - يناير', amount: 85000, expenseDate: new Date(), paidTo: 'العمالة', status: 'approved', createdAt: new Date() }
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  const projectId = new URL(request.url).searchParams.get('projectId');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let expenses = [...DEMO_EXPENSES];
    if (projectId) {
      expenses = expenses.filter(e => e.projectId === projectId);
    }
    return success(expenses);
  }

  try {
    const { db } = await import('@/lib/db');
    const where: { projectId?: string } = {};
    if (projectId) where.projectId = projectId;
    
    const budgets = await db.budget.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' } 
    });
    
    return success(budgets.map(b => ({ 
      id: b.id,
      projectId: b.projectId,
      project: null,
      category: b.category,
      description: b.name,
      amount: b.actualAmount,
      plannedAmount: b.plannedAmount,
      variance: b.variance,
      expenseDate: b.createdAt,
      status: 'approved',
      createdAt: b.createdAt
    })));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create expenses
  if (isDemoUser(user.id)) {
    return error('لا يمكن إنشاء مصروفات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    if (!body.category || !body.amount) return error('الفئة والمبلغ مطلوبان');
    
    const amount = parseFloat(body.amount) || 0;
    const budget = await db.budget.create({ 
      data: { 
        projectId: body.projectId || 'demo-project',
        name: body.description || 'مصروف جديد',
        category: body.category,
        plannedAmount: 0,
        actualAmount: amount,
        committedAmount: 0,
        remainingAmount: -amount,
        variance: -amount
      } 
    });
    return success({ id: budget.id, amount: budget.actualAmount });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update expenses
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث المصروفات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { id, ...data } = await request.json();
    const amount = parseFloat(data.amount) || 0;
    await db.budget.update({ 
      where: { id }, 
      data: {
        name: data.description,
        category: data.category,
        actualAmount: amount,
        variance: -amount
      }
    });
    return success({ id, ...data });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete expenses
  if (isDemoUser(user.id)) {
    return error('لا يمكن حذف المصروفات في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('معرف المصروف مطلوب');
    await db.budget.delete({ where: { id } });
    return success({ message: 'تم الحذف' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}
