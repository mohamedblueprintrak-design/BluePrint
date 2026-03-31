/**
 * Main API Router
 * Central router that dispatches API requests to appropriate handlers
 * يدعم المستخدمين التجريبيين والمستخدمين الحقيقيين
 * 
 * FIXED: Now uses real services for authenticated non-demo users
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest, isDemoUser} from './utils/demo-config';
import { successResponse, errorResponse } from './utils/response';
import { projectService, clientService, taskService, invoiceService } from '@/lib/services';

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
  const organizationId = user?.organizationId;

  try {
    switch (action) {
      case 'dashboard': {
        if (isDemo) {
          return successResponse(generateDemoDashboard());
        }
        // Real user - get stats from services
        const [projectStats, clientStats, taskStats, invoiceStats] = await Promise.all([
          projectService.getProjectStats(organizationId!),
          clientService.getClientStats(organizationId!),
          taskService.getTaskStats(organizationId!),
          invoiceService.getInvoiceStats(organizationId!)
        ]);
        return successResponse({
          projects: projectStats,
          clients: clientStats,
          financial: invoiceStats,
          tasks: taskStats,
          defects: { open: 0, resolved: 0, critical: 0 },
          employees: { total: 0, presentToday: 0, onLeave: 0 }
        });
      }

      case 'projects': {
        if (isDemo) {
          return successResponse(generateDemoProjects());
        }
        // Real user - get from service
        const result = await projectService.getProjects(organizationId!, {}, { page: 1, limit: 100 });
        return successResponse(result.data);
      }

      case 'project': {
        const id = searchParams.get('id');
        if (!id) return errorResponse('Project ID required', 'MISSING_ID', 400);
        if (isDemo) return successResponse(null);
        const project = await projectService.getProjectById(id, organizationId!);
        return successResponse(project);
      }

      case 'tasks': {
        if (isDemo) {
          return successResponse(generateDemoTasks());
        }
        // Real user - get from service
        const result = await taskService.getTasks(organizationId!, {}, { page: 1, limit: 100 });
        return successResponse(result.data);
      }

      case 'task': {
        const id = searchParams.get('id');
        if (!id) return errorResponse('Task ID required', 'MISSING_ID', 400);
        if (isDemo) return successResponse(null);
        const task = await taskService.getTaskById(id, organizationId!);
        return successResponse(task);
      }

      case 'clients': {
        if (isDemo) {
          return successResponse(generateDemoClients());
        }
        // Real user - get from service
        const clients = await clientService.getClients(organizationId!);
        return successResponse(clients);
      }

      case 'client': {
        const id = searchParams.get('id');
        if (!id) return errorResponse('Client ID required', 'MISSING_ID', 400);
        if (isDemo) return successResponse(null);
        const client = await clientService.getClientById(id, organizationId!);
        return successResponse(client);
      }

      case 'invoices': {
        if (isDemo) {
          return successResponse(generateDemoInvoices());
        }
        // Real user - get from service
        const result = await invoiceService.getInvoices(organizationId!, {}, { page: 1, limit: 100 });
        return successResponse(result.data);
      }

      case 'invoice': {
        const id = searchParams.get('id');
        if (!id) return errorResponse('Invoice ID required', 'MISSING_ID', 400);
        if (isDemo) return successResponse(null);
        const invoice = await invoiceService.getInvoiceById(id, organizationId!);
        return successResponse(invoice);
      }

      case 'suppliers':
      case 'materials':
      case 'contracts':
      case 'proposals':
      case 'site-reports':
      case 'documents':
      case 'notifications':
      case 'leave-requests':
      case 'users':
      case 'vouchers':
      case 'budgets':
      case 'expenses':
      case 'attendances':
        // These endpoints return empty for now - to be implemented with real services
        return successResponse(isDemo ? [] : []);

      case 'profile':
        return successResponse(user);

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

  const organizationId = user.organizationId;
  const userId = user.id;

  try {
    const body = await request.json();

    switch (action) {
      case 'project': {
        const project = await projectService.createProject(body, organizationId!, userId);
        return successResponse(project);
      }

      case 'task': {
        const task = await taskService.createTask(body, organizationId!, userId);
        return successResponse(task);
      }

      case 'client': {
        const client = await clientService.createClient(body, organizationId!, userId);
        return successResponse(client);
      }

      case 'invoice': {
        const invoice = await invoiceService.createInvoice(body, organizationId!, userId);
        return successResponse(invoice);
      }

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
        // Placeholder - return created object with ID
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
  const id = searchParams.get('id');

  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  if (isDemoUser(user.id)) {
    return errorResponse('Demo users cannot update resources', 'DEMO_MODE', 403);
  }

  if (!id) {
    return errorResponse('Resource ID required', 'MISSING_ID', 400);
  }

  const organizationId = user.organizationId;
  const userId = user.id;

  try {
    const body = await request.json();

    switch (action) {
      case 'project': {
        const project = await projectService.updateProject(id, body, organizationId!, userId);
        return successResponse(project);
      }

      case 'task': {
        const task = await taskService.updateTask(id, body, organizationId!, userId);
        return successResponse(task);
      }

      case 'client': {
        const client = await clientService.updateClient(id, body, organizationId!, userId);
        return successResponse(client);
      }

      case 'invoice': {
        const invoice = await invoiceService.updateInvoice(id, body, organizationId!, userId);
        return successResponse(invoice);
      }

      default:
        return successResponse(body);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  if (isDemoUser(user.id)) {
    return errorResponse('Demo users cannot delete resources', 'DEMO_MODE', 403);
  }

  if (!id) {
    return errorResponse('Resource ID required', 'MISSING_ID', 400);
  }

  const organizationId = user.organizationId;
  const userId = user.id;

  try {
    switch (action) {
      case 'project': {
        await projectService.deleteProject(id, organizationId!, userId);
        return successResponse({ deleted: true });
      }

      case 'task': {
        await taskService.deleteTask(id, organizationId!, userId);
        return successResponse({ deleted: true });
      }

      case 'client': {
        await clientService.deleteClient(id, organizationId!, userId);
        return successResponse({ deleted: true });
      }

      case 'invoice': {
        await invoiceService.deleteInvoice(id, organizationId!, userId);
        return successResponse({ deleted: true });
      }

      default:
        return successResponse({ deleted: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}
