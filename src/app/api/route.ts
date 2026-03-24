/**
 * Main API Router
 * Central router that dispatches API requests to appropriate handlers
 * يدعم المستخدمين التجريبيين
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from './utils/demo-config';

// Success/Error response helpers
function successResponse(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// Demo data generators
function generateDemoDashboard() {
  return {
    projects: { total: 28, active: 8, completed: 12, pending: 5, onHold: 3 },
    clients: { total: 24, active: 18 },
    financial: {
      totalInvoiced: 1420000,
      totalPaid: 985000,
      totalPending: 435000,
      overdueAmount: 125000
    },
    tasks: { total: 156, pending: 42, inProgress: 38, completed: 76, overdue: 12 },
    defects: { open: 7, resolved: 45, critical: 2 },
    employees: { total: 32, presentToday: 28, onLeave: 4 }
  };
}

function generateDemoProjects() {
  return [
    { id: 'p1', name: 'برج الأعمال', status: 'active', progressPercentage: 45, contractValue: 85000000 },
    { id: 'p2', name: 'مجمع سكني', status: 'active', progressPercentage: 25, contractValue: 120000000 },
    { id: 'p3', name: 'مركز تسوق', status: 'pending', progressPercentage: 0, contractValue: 45000000 },
    { id: 'p4', name: 'فيلا النخيل', status: 'completed', progressPercentage: 100, contractValue: 15000000 },
    { id: 'p5', name: 'مستشفى السلام', status: 'active', progressPercentage: 68, contractValue: 95000000 },
  ];
}

function generateDemoTasks() {
  return [
    { id: 't1', title: 'مراجعة المخططات', status: 'in_progress', priority: 'high', progress: 60, dueDate: new Date('2025-02-15') },
    { id: 't2', title: 'إعداد جدول العمل', status: 'todo', priority: 'medium', progress: 0, dueDate: new Date('2025-02-20') },
    { id: 't3', title: 'تقييم الموردين', status: 'done', priority: 'high', progress: 100, dueDate: new Date('2025-01-30') },
    { id: 't4', title: 'الحصول على التصاريح', status: 'in_progress', priority: 'critical', progress: 30, dueDate: new Date('2025-02-10') },
    { id: 't5', title: 'مراجعة العقود', status: 'todo', priority: 'low', progress: 0, dueDate: new Date('2025-02-28') },
  ];
}

function generateDemoClients() {
  return [
    { id: 'c1', name: 'شركة الفجر للإنشاءات', email: 'info@fajr.ae', phone: '+971501234567', status: 'active' },
    { id: 'c2', name: 'مؤسسة النور', email: 'info@alnoor.ae', phone: '+971502345678', status: 'active' },
    { id: 'c3', name: 'شركة الخليج', email: 'info@gulf.ae', phone: '+971503456789', status: 'active' },
  ];
}

function generateDemoInvoices() {
  return [
    { id: 'inv1', invoiceNumber: 'INV-2025-001', client: 'شركة الفجر', total: 525000, paidAmount: 400000, status: 'partial', dueDate: new Date('2025-02-15') },
    { id: 'inv2', invoiceNumber: 'INV-2025-002', client: 'مؤسسة النور', total: 787500, paidAmount: 0, status: 'sent', dueDate: new Date('2025-02-20') },
    { id: 'inv3', invoiceNumber: 'INV-2025-003', client: 'شركة الخليج', total: 262500, paidAmount: 262500, status: 'paid', dueDate: new Date('2025-02-25') },
  ];
}

// Main GET handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Get user from request (supports demo mode)
  const user = await getUserFromRequest(request);
  
  // For demo users, return demo data
  const isDemo = !user || isDemoUser(user?.id);

  try {
    switch (action) {
      case 'dashboard':
        return successResponse(isDemo ? generateDemoDashboard() : DEMO_DATA.dashboard || generateDemoDashboard());

      case 'projects':
        return successResponse(isDemo ? generateDemoProjects() : []);

      case 'project':
        // Single project - would need database lookup
        return successResponse(null);

      case 'tasks':
        return successResponse(isDemo ? generateDemoTasks() : []);

      case 'task':
        return successResponse(null);

      case 'clients':
        return successResponse(isDemo ? generateDemoClients() : []);

      case 'client':
        return successResponse(null);

      case 'invoices':
        return successResponse(isDemo ? generateDemoInvoices() : []);

      case 'invoice':
        return successResponse(null);

      case 'suppliers':
        return successResponse(isDemo ? [] : []);

      case 'materials':
        return successResponse(isDemo ? [] : []);

      case 'contracts':
        return successResponse(isDemo ? [] : []);

      case 'proposals':
        return successResponse(isDemo ? [] : []);

      case 'site-reports':
        return successResponse(isDemo ? [] : []);

      case 'documents':
        return successResponse(isDemo ? [] : []);

      case 'notifications':
        return successResponse(isDemo ? [] : []);

      case 'leave-requests':
        return successResponse(isDemo ? [] : []);

      case 'users':
        return successResponse(isDemo ? [] : []);

      case 'profile':
        return successResponse(user);

      case 'vouchers':
        return successResponse(isDemo ? [] : []);

      case 'budgets':
        return successResponse(isDemo ? [] : []);

      case 'expenses':
        return successResponse(isDemo ? [] : []);

      case 'attendances':
        return successResponse(isDemo ? [] : []);

      default:
        return errorResponse(`Unknown action: ${action}`, 'UNKNOWN_ACTION', 400);
    }
  } catch (error) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}

// POST handler for creating resources
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  // Demo users cannot create resources
  if (isDemoUser(user.id)) {
    return errorResponse('Demo users cannot create resources', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();

    // These would be implemented with actual database operations
    switch (action) {
      case 'project':
      case 'task':
      case 'client':
      case 'invoice':
      case 'supplier':
      case 'material':
      case 'contract':
      case 'proposal':
      case 'site-report':
      case 'document':
      case 'notification':
      case 'leave-request':
      case 'user':
      case 'voucher':
      case 'budget':
      case 'expense':
        return successResponse({ id: `new-${Date.now()}`, ...body });

      default:
        return errorResponse(`Unknown action: ${action}`, 'UNKNOWN_ACTION', 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}

// PUT handler for updating resources
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  if (isDemoUser(user.id)) {
    return errorResponse('Demo users cannot update resources', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();
    return successResponse(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  if (isDemoUser(user.id)) {
    return errorResponse('Demo users cannot delete resources', 'DEMO_MODE', 403);
  }

  return successResponse({ deleted: true });
}