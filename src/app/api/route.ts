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

      case 'suppliers': {
        if (isDemo) {
          return successResponse([
            { id: 's1', name: 'شركة الحديد والألموني', supplierType: 'manufacturer', email: 'info@iron.ae', phone: '+971504000111', rating: 4.5, creditLimit: 500000, isActive: true },
            { id: 's2', name: 'مصنع الخشب', supplierType: 'factory', email: 'info@wood.ae', phone: '+971504000222', rating: 3.8, creditLimit: 300000, isActive: true },
            { id: 's3', name: 'شركة البلاستيك', supplierType: 'manufacturer', email: 'info@plastic.ae', phone: '+971504000333', rating: 4.2, creditLimit: 200000, isActive: true },
            { id: 's4', name: 'موردو الدهانات', supplierType: 'trader', email: 'info@paints.ae', phone: '+971504000444', rating: 4.0, creditLimit: 150000, isActive: true },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'materials': {
        if (isDemo) {
          return successResponse([
            { id: 'm1', name: 'أسمنت حديد TMT', category: 'metals', unit: 'طن', unitPrice: 4500, currentStock: 500, minStock: 100, maxStock: 2000, isActive: true },
            { id: 'm2', name: 'أسمنت خشب', category: 'wood', unit: 'متر مكعب', unitPrice: 180, currentStock: 2000, minStock: 500, maxStock: 5000, isActive: true },
            { id: 'm3', name: 'بلاستيك PVC', category: 'plastics', unit: 'كيلو', unitPrice: 35, currentStock: 10000, minStock: 2000, maxStock: 50000, isActive: true },
            { id: 'm4', name: 'أسمنت أسمنت', category: 'cement', unit: 'طن', unitPrice: 25, currentStock: 50000, minStock: 10000, maxStock: 100000, isActive: true },
            { id: 'm5', name: 'دهانات زيتي', category: 'paints', unit: 'لتر', unitPrice: 120, currentStock: 2000, minStock: 500, maxStock: 5000, isActive: true },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'contracts': {
        if (isDemo) {
          return successResponse([
            { id: 'ct1', contractNumber: 'CT-2025-001', title: 'عقد إنشاء برج الأعمال', contractType: 'lump_sum', contractValue: 85000000, clientId: 'c1', projectId: 'p1', startDate: '2025-01-01', endDate: '2026-06-30', retentionPercentage: 5, advancePayment: 10, status: 'active' },
            { id: 'ct2', contractNumber: 'CT-2025-002', title: 'عقد تصميم المجمع السكني', contractType: 'unit_price', contractValue: 120000000, clientId: 'c2', projectId: 'p2', startDate: '2025-02-01', endDate: '2027-01-31', retentionPercentage: 7, advancePayment: 15, status: 'active' },
            { id: 'ct3', contractNumber: 'CT-2025-003', title: 'عقد تشطيب مستشفى السلام', contractType: 'lump_sum', contractValue: 95000000, clientId: 'c3', projectId: 'p5', startDate: '2025-01-15', endDate: '2026-12-31', retentionPercentage: 5, advancePayment: 10, status: 'active' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'proposals': {
        if (isDemo) {
          return successResponse([
            { id: 'pr1', proposalNumber: 'PRP-2025-001', title: 'اقتراح تصميم برج الأعمال', clientId: 'c1', projectId: 'p1', totalAmount: 85000000, status: 'accepted', issueDate: '2025-01-01', validUntil: '2025-02-01' },
            { id: 'pr2', proposalNumber: 'PRP-2025-002', title: 'اقتراح تصميم مجمع سكني', clientId: 'c2', projectId: 'p2', totalAmount: 120000000, status: 'sent', issueDate: '2025-02-01', validUntil: '2025-03-01' },
            { id: 'pr3', proposalNumber: 'PRP-2025-003', title: 'اقتراح إدارة مشروع المستشفى', clientId: 'c3', projectId: 'p5', totalAmount: 95000000, status: 'draft', issueDate: '2025-01-10', validUntil: '2025-02-10' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'site-reports': {
        if (isDemo) {
          return successResponse([
            { id: 'sr1', projectId: 'p1', reportNumber: 'SR-001', reportDate: '2025-02-01', weather: 'صاف', workersCount: 45, workDescription: 'صب الخرسانة الأرضية والأساسات', workProgress: 60, notes: 'تم الانتهاء من مرحلة الأساسات', safetyIssues: 'لا توجد', equipmentUsed: 'رافعة برجي، خلاط كهرباء', nextSteps: 'بدء صب الهيكل' },
            { id: 'sr2', projectId: 'p2', reportNumber: 'SR-002', reportDate: '2025-02-02', weather: 'مشمس جزئياً', workersCount: 30, workDescription: 'تركيب هيكل الأعمدة', workProgress: 25, notes: 'تأخر التوريدات', safetyIssues: 'حادثة بسيطة - تم معالجتها', equipmentUsed: 'رافعة, براج', nextSteps: 'استكمال التوريدات' },
            { id: 'sr3', projectId: 'p5', reportNumber: 'SR-003', reportDate: '2025-02-03', weather: 'مشمس', workersCount: 60, workDescription: 'أعمال السباكة والتمديدات', workProgress: 70, notes: 'سير العمل بشكل طبيعي', safetyIssues: 'لا توجد', equipmentUsed: 'خلاط, رافعة, مكانكة', nextSteps: 'تركيب الأنابيب' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'documents': {
        if (isDemo) {
          return successResponse([
            { id: 'd1', filename: 'مخططات هيكلية برج الأعمال.pdf', fileType: 'pdf', category: 'structural', uploadedById: 'demo-admin-001', createdAt: '2025-01-15' },
            { id: 'd2', filename: 'مواصفات مجمع سكني.pdf', fileType: 'pdf', category: 'architectural', uploadedById: 'demo-admin-001', createdAt: '2025-01-20' },
            { id: 'd3', filename: 'تقرير فحص الموقع.pdf', fileType: 'pdf', category: 'inspection', uploadedById: 'demo-admin-001', createdAt: '2025-02-01' },
            { id: 'd4', filename: 'عقد إنشاء برج الأعمال.pdf', fileType: 'pdf', category: 'contracts', uploadedById: 'demo-admin-001', createdAt: '2025-01-10' },
            { id: 'd5', filename: 'خطة المشروع الزمني.pdf', fileType: 'pdf', category: 'planning', uploadedById: 'demo-manager-001', createdAt: '2025-01-25' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'notifications': {
        if (isDemo) {
          return successResponse([
            { id: 'n1', userId: 'demo-manager-001', title: 'مهمة جديدة: مراجعة المخططات', message: 'تم تعيين مهمة مراجعة جديدة لك', notificationType: 'task_assigned', isRead: false, priority: 'high', createdAt: '2025-02-10T10:30:00Z' },
            { id: 'n2', userId: 'demo-manager-001', title: 'فاتورة مستحقة', message: 'فاتورة INV-2025-001 مستحقة بعد 3 أيام', notificationType: 'invoice_overdue', isRead: true, priority: 'urgent', createdAt: '2025-02-12T09:00:00Z' },
            { id: 'n3', userId: 'demo-manager-001', title: 'تحديث تقدم المشروع', message: 'تقدم مشروع برج الأعمال وصل 45%', notificationType: 'project_update', isRead: true, priority: 'normal', createdAt: '2025-02-13T14:00:00Z' },
            { id: 'n4', userId: 'demo-manager-001', title: 'موافقة إجازة', message: 'تمت الموافقة على إجازتك', notificationType: 'leave_approved', isRead: false, priority: 'normal', createdAt: '2025-02-14T11:00:00Z' },
            { id: 'n5', userId: 'demo-manager-001', title: 'مهمة عاجلة', message: 'مهام المستندجات الإلكترونية مستحقة', notificationType: 'deadline_approaching', isRead: false, priority: 'high', createdAt: '2025-02-15T08:00:00Z' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'leave-requests': {
        if (isDemo) {
          return successResponse([
            { id: 'lr1', userId: 'demo-engineer-001', leaveType: 'annual', startDate: '2025-03-01', endDate: '2025-03-15', daysCount: 15, status: 'approved', reason: 'إجازة سنوية', approvedById: 'demo-admin-001', createdAt: '2025-02-10T09:00:00Z' },
            { id: 'lr2', userId: 'demo-engineer-001', leaveType: 'sick', startDate: '2025-02-20', endDate: '2025-02-20', daysCount: 1, status: 'pending', reason: 'مرض', createdAt: '2025-02-20T07:00:00Z' },
            { id: 'lr3', userId: 'demo-manager-001', leaveType: 'emergency', startDate: '2025-02-25', endDate: '2025-02-26', daysCount: 2, status: 'rejected', reason: 'ظرف طارئ', rejectionReason: 'لا يوجد تغط工作开展 حالياً', createdAt: '2025-02-25T10:00:00Z' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'users': {
        if (isDemo) {
          return successResponse([
            { id: 'demo-admin-001', username: 'admin', email: 'admin@blueprint.ae', fullName: 'أحمد المدير', role: 'ADMIN', department: 'الإدارة', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-manager-001', username: 'manager', email: 'manager@blueprint.ae', fullName: 'محمد مدير', role: 'MANAGER', department: 'الإدارة', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-engineer-001', username: 'engineer', email: 'engineer@blueprint.ae', fullName: 'محمد مهندس', role: 'ENGINEER', department: 'التصميم', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-struct-eng-001', username: 'struct_eng', email: 'struct_eng@blueprint.ae', fullName: 'خالد مهندس هيكلي', role: 'ENGINEER', department: 'الهيكلية', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-elec-eng-001', username: 'elec_eng', email: 'elec_eng@blueprint.ae', fullName: 'فاطمة مهندسة كهربائية', role: 'ENGINEER', department: 'الكهرباء', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-site-eng-001', username: 'site_eng', email: 'site_eng@blueprint.ae', fullName: 'سعيد مهندس مدني', role: 'ENGINEER', department: 'الموقع', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-mech-eng-001', username: 'mech_eng', email: 'mech_eng@blueprint.ae', fullName: 'عمرو مهندس ميكانيكي', role: 'ENGINEER', department: 'الميكانيك', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-draftsman-001', username: 'draftsman', email: 'draftsman@blueprint.ae', fullName: 'ياسر مهندس معماري', role: 'DRAFTSMAN', department: 'الرسم', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-accountant-001', username: 'accountant', email: 'accountant@blueprint.ae', fullName: 'سارة محاسبة', role: 'ACCOUNTANT', department: 'المالية', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-secretary-001', username: 'secretary', email: 'secretary@blueprint.ae', fullName: 'نورة سكرتارية', role: 'SECRETARY', department: 'السكرتارية', isActive: true, createdAt: '2025-01-01' },
            { id: 'demo-viewer-001', username: 'viewer', email: 'viewer@blueprint.ae', fullName: 'عبدالله مراقب', role: 'VIEWER', department: '-', isActive: true, createdAt: '2025-01-01' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'vouchers': {
        if (isDemo) {
          return successResponse([
            { id: 'v1', voucherNumber: 'VCH-2025-001', voucherType: 'payment', amount: 200000, currency: 'AED', exchangeRate: 1, baseAmount: 200000, date: '2025-02-01', projectId: 'p1', projectName: 'برج الأعمال', clientId: 'c1', clientName: 'شركة الفجر', paymentMethod: 'bank_transfer', status: 'completed', approvedById: 'demo-admin-001' },
            { id: 'v2', voucherNumber: 'VCH-2025-002', voucherType: 'receipt', amount: 150000, currency: 'AED', exchangeRate: 1, baseAmount: 150000, date: '2025-02-05', projectId: 'p2', projectName: 'مجمع سكني', clientId: 'c2', clientName: 'مؤسسة النور', paymentMethod: 'cash', status: 'completed' },
            { id: 'v3', voucherNumber: 'VCH-2025-003', voucherType: 'payment', amount: 500000, currency: 'AED', exchangeRate: 1, baseAmount: 500000, date: '2025-02-10', projectId: 'p5', projectName: 'مستشفى السلام', clientId: 'c3', clientName: 'شركة الخليج', paymentMethod: 'bank_transfer', status: 'pending' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'budgets': {
        if (isDemo) {
          return successResponse([
            { id: 'b1', projectId: 'p1', category: 'structural', description: 'أعمال الهيكل', budgetAmount: 25000000, actualAmount: 15000000, variance: 10000000, createdAt: '2025-01-01' },
            { id: 'b2', projectId: 'p1', category: 'electrical', description: 'الأعمال الكهربائية', budgetAmount: 8000000, actualAmount: 5000000, variance: 3000000, createdAt: '2025-01-01' },
            { id: 'b3', projectId: 'p1', category: 'mechanical', description: 'الأعمال الميكانيكية', budgetAmount: 12000000, actualAmount: 8500000, variance: 3500000, createdAt: '2025-01-01' },
            { id: 'b4', projectId: 'p1', category: 'finishing', description: 'أعمال التشطيب', budgetAmount: 6000000, actualAmount: 2000000, variance: 4000000, createdAt: '2025-01-01' },
            { id: 'b5', projectId: 'p2', category: 'structural', description: 'هيكل المجمع', budgetAmount: 40000000, actualAmount: 10000000, variance: 30000000, createdAt: '2025-02-01' },
            { id: 'b6', projectId: 'p5', category: 'medical', description: 'تجهيزات طبية', budgetAmount: 15000000, actualAmount: 5000000, variance: 10000000, createdAt: '2025-01-15' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'expenses': {
        if (isDemo) {
          return successResponse([
            { id: 'e1', projectId: 'p1', category: 'materials', description: 'شراء حديد', amount: 450000, expenseDate: '2025-02-01', status: 'approved', createdById: 'demo-manager-001', createdAt: '2025-02-01' },
            { id: 'e2', projectId: 'p1', category: 'transport', description: 'نقل مواد', amount: 35000, expenseDate: '2025-02-03', status: 'approved', createdById: 'demo-manager-001', createdAt: '2025-02-03' },
            { id: 'e3', projectId: 'p2', category: 'equipment_rental', description: 'إيجار رافعة برجي', amount: 25000, expenseDate: '2025-02-05', status: 'approved', createdById: 'demo-manager-001', createdAt: '2025-02-05' },
            { id: 'e4', projectId: 'p1', category: 'labor_overtime', description: 'ساعات إضافية', amount: 15000, expenseDate: '2025-02-10', status: 'pending', createdById: 'demo-manager-001', createdAt: '2025-02-10' },
            { id: 'e5', projectId: 'p5', category: 'consultant', description: 'استشاريع استشاري', amount: 50000, expenseDate: '2025-02-15', status: 'approved', createdById: 'demo-manager-001', createdAt: '2025-02-15' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

      case 'attendances': {
        if (isDemo) {
          const today = new Date().toISOString().split('T')[0];
          return successResponse([
            { id: 'att1', userId: 'demo-engineer-001', date: today, checkIn: '08:00', checkOut: '17:00', status: 'present', workHours: 9, overtimeHours: 1, notes: '' },
            { id: 'att2', userId: 'demo-engineer-001', date: today, checkIn: '08:05', checkOut: '17:05', status: 'present', workHours: 9, overtimeHours: 1, notes: '' },
            { id: 'att3', userId: 'demo-manager-001', date: today, checkIn: '08:30', checkOut: '18:00', status: 'present', workHours: 9.5, overtimeHours: 2.5, notes: '' },
            { id: 'att4', userId: 'demo-struct-eng-001', date: today, checkIn: '07:55', checkOut: '16:00', status: 'present', workHours: 8, overtimeHours: 0, notes: '' },
            { id: 'att5', userId: 'demo-accountant-001', date: today, checkIn: '09:00', checkOut: '17:00', status: 'present', workHours: 8, overtimeHours: 0, notes: '' },
            { id: 'att6', userId: 'demo-draftsman-001', date: today, checkIn: '08:00', checkOut: '16:30', status: 'late', workHours: 8.5, overtimeHours: 0, notes: '' },
            { id: 'att7', userId: 'demo-secretary-001', date: today, checkIn: '09:00', checkOut: '17:00', status: 'present', workHours: 8, overtimeHours: 0, notes: '' },
            { id: 'att8', userId: 'demo-viewer-001', date: today, checkIn: '09:30', checkOut: '13:00', status: 'absent', workHours: 3.5, overtimeHours: 0, notes: 'إجازة مرضية' },
            { id: 'att9', userId: 'demo-site-eng-001', date: today, checkIn: '07:00', checkOut: '15:00', status: 'absent', workHours: 0, overtimeHours: 0, notes: 'إجازة بدون إخطار' },
          ]);
        }
        return successResponse(isDemo ? [] : []);
      }

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
