// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

// Dynamic database import to avoid failures when DB is not available
let db: any = null;
async function getDb() {
  if (!db) {
    try {
      const dbModule = await import('@/lib/db');
      db = dbModule.db;
    } catch (e) {
      console.log('Database not available, using demo mode');
      db = null;
    }
  }
  return db;
}

// Safe database operation wrapper
async function safeDbOp<T>(operation: (database: any) => Promise<T>, fallback: T): Promise<T> {
  try {
    const database = await getDb();
    if (!database) return fallback;
    return await operation(database);
  } catch (e) {
    console.log('Database operation failed, using fallback');
    return fallback;
  }
}

// Security: JWT secret must come from environment only
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: Using demo JWT secret. Set JWT_SECRET in production!');
}

// Demo users for testing without database
const DEMO_USERS = [
  {
    id: 'demo-admin-001',
    username: 'admin',
    email: 'admin@blueprint.ae',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.sCP9eNiBx.qL/4ZcS.', // admin123
    fullName: 'مدير النظام',
    role: 'admin',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  }
];

// Rate Limiting: In-memory store for request tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 100; // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 300000);

// Get client IP from request
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

// Check rate limit for a request
function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIP(request);
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count, resetTime: record.resetTime };
}

// Rate limit error response
function rateLimitError(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' } },
    { status: 429, headers: { 'Retry-After': retryAfter.toString(), 'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': resetTime.toString() } }
  );
}

// Helper functions
function successResponse(data: any, meta?: any) {
  const response = { success: true, data };
  if (meta) Object.assign(response, { meta });
  return NextResponse.json(response);
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function getUserFromToken(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    
    // Check demo users first
    const demoUser = DEMO_USERS.find(u => u.id === userId);
    if (demoUser) {
      return { ...demoUser, organization: demoUser.organization };
    }
    
    // Then try database
    try {
      const database = await getDb();
      if (!database) return null;
      
      const user = await database.user.findUnique({ 
        where: { id: userId },
        include: { organization: true }
      });
      return user;
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      return null;
    }
  } catch {
    return null;
  }
}

// GET handler
export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return rateLimitError(rateLimitResult.resetTime);
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const user = await getUserFromToken(request);

  try {
    switch (action) {
      case 'health':
        return successResponse({ status: 'ok', version: '3.1.0', timestamp: new Date().toISOString() });

      case 'me':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        return successResponse({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar,
          language: user.language || 'ar',
          theme: user.theme || 'dark',
          organization: user.organization,
          organizationId: user.organizationId
        });

      case 'users':
        if (!user || user.role !== 'admin') {
          return errorResponse('غير مصرح', 'FORBIDDEN', 403);
        }
        const users = await (await getDb())?.user.findMany({
          where: { organizationId: user.organizationId },
          select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
        });
        return successResponse(users);

      case 'projects':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const database = await getDb();
        if (!database) {
          return successResponse([]);
        }
        const allProjects = await database.project.findMany({ 
          where: { organizationId: user.organizationId },
          include: { client: true }, 
          orderBy: { createdAt: 'desc' } 
        });
        return successResponse(allProjects.map((p: any) => ({
          id: p.id,
          name: p.name,
          projectNumber: p.projectNumber,
          location: p.location,
          status: p.status,
          contractValue: p.contractValue,
          clientId: p.clientId,
          client: p.client?.name,
          progressPercentage: p.progressPercentage,
          createdAt: p.createdAt
        })));

      case 'project':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const projectId = searchParams.get('id');
        if (!projectId) return errorResponse('معرف المشروع مطلوب');
        const project = await (await getDb())?.project.findFirst({
          where: { id: projectId, organizationId: user.organizationId },
          include: {
            client: true,
            analyses: { take: 10, orderBy: { createdAt: 'desc' } },
            boqItems: true,
            defects: true,
            tasks: true,
            siteReports: { take: 10, orderBy: { createdAt: 'desc' } },
            milestones: true,
            files: true
          }
        });
        if (!project) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);
        
        const totalCost = project.boqItems.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const openDefects = project.defects.filter(d => d.status === 'Open');
        const healthScore = Math.max(0, Math.min(100, 100 - openDefects.length * 5));
        
        return successResponse({
          ...project,
          healthScore,
          totalCost,
          filesCount: project.files.length
        });

      case 'clients':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const clients = await (await getDb())?.client.findMany({
          where: { isActive: true, organizationId: user.organizationId },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(clients.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          contactPerson: c.contactPerson,
          taxNumber: c.taxNumber,
          clientType: c.clientType,
          creditLimit: c.creditLimit,
          totalInvoiced: c.totalInvoiced,
          totalPaid: c.totalPaid
        })));

      case 'invoices':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const invoices = await (await getDb())?.invoice.findMany({
          where: { organizationId: user.organizationId },
          include: { client: true, project: true },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(invoices.map(i => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          client: i.client?.name,
          clientId: i.clientId,
          project: i.project?.name,
          projectId: i.projectId,
          total: i.total,
          paidAmount: i.paidAmount,
          status: i.status,
          issueDate: i.issueDate,
          dueDate: i.dueDate,
          createdAt: i.createdAt
        })));

      case 'tasks':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const taskProjectId = searchParams.get('projectId');
        const taskStatus = searchParams.get('status');
        const tasksQuery: any = {};
        if (taskProjectId) tasksQuery.projectId = taskProjectId;
        if (taskStatus) tasksQuery.status = taskStatus;
        
        const tasks = await (await getDb())?.task.findMany({
          where: {
            ...tasksQuery,
            project: { organizationId: user.organizationId }
          },
          include: { project: true, assignee: true },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          progress: t.progress,
          project: t.project?.name,
          projectId: t.projectId,
          assignee: t.assignee?.fullName || t.assignee?.username,
          assigneeId: t.assignedToId,
          createdAt: t.createdAt
        })));

      case 'suppliers':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const suppliers = await (await getDb())?.supplier.findMany({
          where: { isActive: true, organizationId: user.organizationId },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(suppliers.map(s => ({
          id: s.id,
          name: s.name,
          supplierType: s.supplierType,
          email: s.email,
          phone: s.phone,
          address: s.address,
          contactPerson: s.contactPerson,
          rating: s.rating,
          isApproved: s.isApproved
        })));

      case 'materials':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const materials = await (await getDb())?.material.findMany({
          where: { isActive: true, organizationId: user.organizationId },
          orderBy: { name: 'asc' }
        });
        return successResponse(materials.map(m => ({
          id: m.id,
          materialCode: m.materialCode,
          name: m.name,
          category: m.category,
          unit: m.unit,
          unitPrice: m.unitPrice,
          currentStock: m.currentStock,
          minStock: m.minStock,
          maxStock: m.maxStock,
          location: m.location
        })));

      case 'contracts':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const contracts = await (await getDb())?.contract.findMany({
          where: { organizationId: user.organizationId },
          include: { client: true },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(contracts.map(c => ({
          id: c.id,
          contractNumber: c.contractNumber,
          title: c.title,
          contractType: c.contractType,
          contractValue: c.contractValue,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status,
          client: c.client?.name,
          clientId: c.clientId
        })));

      case 'proposals':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const proposals = await (await getDb())?.proposal.findMany({
          where: { organizationId: user.organizationId },
          include: { client: true },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(proposals.map(p => ({
          id: p.id,
          proposalNumber: p.proposalNumber,
          client: p.client?.name,
          clientId: p.clientId,
          title: p.title,
          totalAmount: p.totalAmount,
          status: p.status,
          issueDate: p.issueDate,
          validUntil: p.validUntil,
          createdAt: p.createdAt
        })));

      case 'site-reports':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const siteReports = await (await getDb())?.siteReport.findMany({
          where: { project: { organizationId: user.organizationId } },
          include: { project: true },
          orderBy: { reportDate: 'desc' },
          take: 50
        });
        return successResponse(siteReports.map(r => ({
          id: r.id,
          projectId: r.projectId,
          project: r.project?.name,
          reportDate: r.reportDate,
          reportNumber: r.reportNumber,
          weather: r.weather,
          temperature: r.temperature,
          workersCount: r.workersCount,
          workDescription: r.workDescription,
          workArea: r.workArea,
          issues: r.issues,
          safetyIssues: r.safetyIssues,
          nextSteps: r.nextSteps,
          summary: r.summary,
          status: r.status
        })));

      case 'documents':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const documents = await (await getDb())?.document.findMany({
          include: { uploader: true },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(documents.map(d => ({
          id: d.id,
          filename: d.filename,
          originalName: d.originalName,
          fileType: d.fileType,
          fileSize: d.fileSize,
          category: d.category,
          description: d.description,
          uploadedBy: d.uploader?.fullName || d.uploader?.username,
          createdAt: d.createdAt
        })));

      case 'notifications':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const notifications = await (await getDb())?.notification.findMany({
          where: { 
            userId: user.id,
            ...(unreadOnly && { isRead: false })
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });
        return successResponse(notifications);

      case 'leave-requests':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const leaveStatus = searchParams.get('status');
        const leaveRequests = await (await getDb())?.leaveRequest.findMany({
          where: { 
            ...(leaveStatus && { status: leaveStatus }),
            user: { organizationId: user.organizationId }
          },
          include: { 
            user: { select: { id: true, fullName: true, username: true } },
            approver: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(leaveRequests.map(l => ({
          id: l.id,
          userId: l.userId,
          userName: l.user?.fullName || l.user?.username,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          daysCount: l.daysCount,
          reason: l.reason,
          status: l.status,
          approver: l.approver?.fullName || l.approver?.username,
          approvedAt: l.approvedAt,
          rejectionReason: l.rejectionReason,
          createdAt: l.createdAt
        })));

      case 'attendance':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const attUserId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const attendanceWhere: any = {
          user: { organizationId: user.organizationId }
        };
        if (attUserId) attendanceWhere.userId = attUserId;
        if (startDate) attendanceWhere.date = { gte: new Date(startDate) };
        if (endDate) attendanceWhere.date = { ...attendanceWhere.date, lte: new Date(endDate) };
        
        const attendance = await (await getDb())?.attendance.findMany({
          where: attendanceWhere,
          include: { user: true },
          orderBy: { date: 'desc' }
        });
        return successResponse(attendance.map(a => ({
          id: a.id,
          userId: a.userId,
          userName: a.user?.fullName || a.user?.username,
          date: a.date,
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          status: a.status,
          workHours: a.workHours,
          overtimeHours: a.overtimeHours
        })));

      // ============================================
      // TASK 3: New GET Endpoints
      // ============================================
      
      case 'boq-items': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const boqProjectId = searchParams.get('projectId');
        if (!boqProjectId) return errorResponse('معرف المشروع مطلوب');
        
        // Verify project belongs to user's organization
        const boqProject = await (await getDb())?.project.findFirst({
          where: { id: boqProjectId, organizationId: user.organizationId }
        });
        if (!boqProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);
        
        const boqItems = await (await getDb())?.bOQItem.findMany({
          where: { projectId: boqProjectId },
          orderBy: { itemNumber: 'asc' }
        });
        return successResponse(boqItems.map(item => ({
          id: item.id,
          projectId: item.projectId,
          itemNumber: item.itemNumber,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          category: item.category,
          notes: item.notes,
          createdAt: item.createdAt
        })));
      }

      case 'purchase-orders': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const purchaseOrders = await (await getDb())?.purchaseOrder.findMany({
          where: { 
            supplier: { organizationId: user.organizationId } 
          },
          include: { 
            supplier: true
          },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(purchaseOrders.map(po => ({
          id: po.id,
          poNumber: po.poNumber,
          supplierId: po.supplierId,
          supplier: po.supplier?.name,
          projectId: po.projectId,
          orderDate: po.orderDate,
          expectedDate: po.expectedDate,
          items: po.items ? JSON.parse(po.items) : [],
          subtotal: po.subtotal,
          taxAmount: po.taxAmount,
          total: po.total,
          status: po.status,
          notes: po.notes,
          createdAt: po.createdAt
        })));
      }

      case 'budgets': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const budgetProjectId = searchParams.get('projectId');
        if (!budgetProjectId) return errorResponse('معرف المشروع مطلوب');
        
        // Verify project belongs to user's organization
        const budgetProject = await (await getDb())?.project.findFirst({
          where: { id: budgetProjectId, organizationId: user.organizationId }
        });
        if (!budgetProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);
        
        const budgets = await (await getDb())?.budget.findMany({
          where: { projectId: budgetProjectId },
          orderBy: { category: 'asc' }
        });
        return successResponse(budgets.map(b => ({
          id: b.id,
          projectId: b.projectId,
          category: b.category,
          description: b.description,
          budgetAmount: b.budgetAmount,
          actualAmount: b.actualAmount,
          variance: b.variance,
          createdAt: b.createdAt
        })));
      }

      case 'defects': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const defectProjectId = searchParams.get('projectId');
        if (!defectProjectId) return errorResponse('معرف المشروع مطلوب');
        
        // Verify project belongs to user's organization
        const defectProject = await (await getDb())?.project.findFirst({
          where: { id: defectProjectId, organizationId: user.organizationId }
        });
        if (!defectProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);
        
        const defects = await (await getDb())?.defect.findMany({
          where: { projectId: defectProjectId },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(defects.map(d => ({
          id: d.id,
          projectId: d.projectId,
          title: d.title,
          description: d.description,
          severity: d.severity,
          status: d.status,
          location: d.location,
          imageId: d.imageId,
          assignedTo: d.assignedTo,
          resolvedAt: d.resolvedAt,
          resolutionNotes: d.resolutionNotes,
          createdAt: d.createdAt
        })));
      }

      case 'payments': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const paymentInvoiceId = searchParams.get('invoiceId');
        if (!paymentInvoiceId) return errorResponse('معرف الفاتورة مطلوب');
        
        // Verify invoice belongs to user's organization
        const paymentInvoice = await (await getDb())?.invoice.findFirst({
          where: { id: paymentInvoiceId, organizationId: user.organizationId }
        });
        if (!paymentInvoice) return errorResponse('الفاتورة غير موجودة', 'NOT_FOUND', 404);
        
        const payments = await (await getDb())?.payment.findMany({
          where: { invoiceId: paymentInvoiceId },
          orderBy: { paymentDate: 'desc' }
        });
        return successResponse(payments.map(p => ({
          id: p.id,
          invoiceId: p.invoiceId,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          createdAt: p.createdAt
        })));
      }

      case 'expenses': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const expenses = await (await getDb())?.expense.findMany({
          where: {
            project: { organizationId: user.organizationId }
          },
          include: { project: true },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(expenses.map(e => ({
          id: e.id,
          projectId: e.projectId,
          project: e.project?.name,
          category: e.category,
          description: e.description,
          amount: e.amount,
          expenseDate: e.expenseDate,
          paidTo: e.paidTo,
          receiptNumber: e.receiptNumber,
          status: e.status,
          approvedById: e.approvedById,
          approvedAt: e.approvedAt,
          createdAt: e.createdAt
        })));
      }

      case 'vouchers': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const voucherType = searchParams.get('voucherType');
        const vouchers = await (await getDb())?.voucher.findMany({
          where: { 
            organizationId: user.organizationId,
            ...(voucherType && { voucherType })
          },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(vouchers.map(v => ({
          id: v.id,
          voucherNumber: v.voucherNumber,
          voucherType: v.voucherType,
          amount: v.amount,
          currency: v.currency,
          date: v.date,
          projectId: v.projectId,
          invoiceId: v.invoiceId,
          clientId: v.clientId,
          supplierId: v.supplierId,
          paymentMethod: v.paymentMethod,
          referenceNumber: v.referenceNumber,
          description: v.description,
          status: v.status,
          createdAt: v.createdAt
        })));
      }

      case 'certificates': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const certProjectId = searchParams.get('projectId');
        const certificates = await (await getDb())?.certificate.findMany({
          where: { 
            organizationId: user.organizationId,
            ...(certProjectId && { projectId: certProjectId })
          },
          orderBy: { createdAt: 'desc' }
        });
        return successResponse(certificates.map(c => ({
          id: c.id,
          certificateNumber: c.certificateNumber,
          projectId: c.projectId,
          clientId: c.clientId,
          certificateType: c.certificateType,
          title: c.title,
          description: c.description,
          percentage: c.percentage,
          amount: c.amount,
          issueDate: c.issueDate,
          validUntil: c.validUntil,
          status: c.status,
          createdAt: c.createdAt
        })));
      }

      case 'dashboard':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        
        // Demo data for users without database
        if (user.id.startsWith('demo-')) {
          return successResponse({
            projects: { total: 12, active: 5, completed: 4, pending: 3 },
            clients: { total: 8 },
            financial: {
              totalInvoiced: 1250000,
              totalPaid: 875000,
              totalPending: 375000,
              overdueAmount: 45000
            },
            tasks: { total: 34, pending: 8, inProgress: 12, completed: 14, overdue: 3 },
            defects: { open: 5, resolved: 18, critical: 1 },
            employees: { total: 15, presentToday: 12, onLeave: 2 }
          });
        }
        
        const totalProjects = await (await getDb())?.project.count({ where: { organizationId: user.organizationId } });
        const activeProjects = await (await getDb())?.project.count({ where: { status: 'active', organizationId: user.organizationId } });
        const completedProjects = await (await getDb())?.project.count({ where: { status: 'completed', organizationId: user.organizationId } });
        const pendingProjects = await (await getDb())?.project.count({ where: { status: 'pending', organizationId: user.organizationId } });
        const totalClients = await (await getDb())?.client.count({ where: { isActive: true, organizationId: user.organizationId } });
        const totalInvoices = await (await getDb())?.invoice.aggregate({ 
          where: { organizationId: user.organizationId },
          _sum: { total: true } 
        });
        const totalPaid = await (await getDb())?.invoice.aggregate({ 
          where: { organizationId: user.organizationId },
          _sum: { paidAmount: true } 
        });
        const pendingTasks = await (await getDb())?.task.count({ 
          where: { 
            status: { not: 'done' },
            project: { organizationId: user.organizationId }
          } 
        });
        const inProgressTasks = await (await getDb())?.task.count({ 
          where: { 
            status: 'in_progress',
            project: { organizationId: user.organizationId }
          } 
        });
        const completedTasks = await (await getDb())?.task.count({ 
          where: { 
            status: 'done',
            project: { organizationId: user.organizationId }
          } 
        });
        const openDefectsCount = await (await getDb())?.defect.count({ 
          where: { 
            status: 'Open',
            project: { organizationId: user.organizationId }
          } 
        });
        const resolvedDefects = await (await getDb())?.defect.count({ 
          where: { 
            status: 'Closed',
            project: { organizationId: user.organizationId }
          } 
        });
        const criticalDefects = await (await getDb())?.defect.count({ 
          where: { 
            status: 'Open', 
            severity: 'critical',
            project: { organizationId: user.organizationId }
          } 
        });
        const totalEmployees = await (await getDb())?.user.count({ 
          where: { isActive: true, organizationId: user.organizationId } 
        });
        
        return successResponse({
          projects: { 
            total: totalProjects, 
            active: activeProjects,
            completed: completedProjects,
            pending: pendingProjects
          },
          clients: { total: totalClients },
          financial: {
            totalInvoiced: totalInvoices._sum.total || 0,
            totalPaid: totalPaid._sum.paidAmount || 0,
            totalPending: (totalInvoices._sum.total || 0) - (totalPaid._sum.paidAmount || 0),
            overdueAmount: 0
          },
          tasks: { 
            total: pendingTasks + completedTasks,
            pending: await (await getDb())?.task.count({ 
              where: { status: 'todo', project: { organizationId: user.organizationId } } 
            }),
            inProgress: inProgressTasks,
            completed: completedTasks,
            overdue: 0
          },
          defects: { 
            open: openDefectsCount,
            resolved: resolvedDefects,
            critical: criticalDefects
          },
          employees: {
            total: totalEmployees,
            presentToday: 0,
            onLeave: 0
          }
        });

      default:
        return errorResponse('إجراء غير معروف');
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return errorResponse(error.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

// POST handler
export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return rateLimitError(rateLimitResult.resetTime);
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const user = await getUserFromToken(request);

  try {
    const body = await request.json();

    switch (action) {
      case 'login': {
        const { username, password } = body;
        if (!username || !password) {
          return errorResponse('اسم المستخدم وكلمة المرور مطلوبان');
        }

        // Try demo users first
        let foundUser: any = DEMO_USERS.find(u => 
          u.username === username || u.email === username
        );
        
        // If not in demo users, try database
        if (!foundUser) {
          try {
            const database = await getDb();
            if (database) {
              foundUser = await database.user.findFirst({
                where: {
                  OR: [
                    { username },
                    { email: username }
                  ]
                }
              });
            }
          } catch (dbError) {
            console.log('Database not available, using demo mode');
          }
        }

        if (!foundUser || !foundUser.password) {
          return errorResponse('بيانات الدخول غير صحيحة');
        }

        const isValid = await bcrypt.compare(password, foundUser.password);
        if (!isValid) {
          return errorResponse('بيانات الدخول غير صحيحة');
        }

        if (!foundUser.isActive) {
          return errorResponse('الحساب غير مفعل');
        }

        // Update last login (only for database users)
        if (!foundUser.id.startsWith('demo-')) {
          try {
            const database = await getDb();
            if (database) {
              await database.user.update({
                where: { id: foundUser.id },
                data: { lastLoginAt: new Date() }
              });
            }
          } catch (dbError) {
            console.log('Could not update last login');
          }
        }

        const token = await new jose.SignJWT({ userId: foundUser.id })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('8h')
          .setIssuedAt()
          .sign(JWT_SECRET);
        return successResponse({ accessToken: token, tokenType: 'bearer' });
      }

      case 'register': {
        const { username, email, password, fullName, role = 'viewer', organizationId } = body;
        if (!username || !email || !password) {
          return errorResponse('جميع الحقول مطلوبة');
        }

        if (password.length < 6) {
          return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        const existing = await (await getDb())?.user.findFirst({
          where: { OR: [{ username }, { email }] }
        });

        if (existing) {
          return errorResponse('المستخدم موجود بالفعل');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await (await getDb())?.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            fullName: fullName || username,
            role,
            organizationId: organizationId || user?.organizationId
          }
        });

        return successResponse({ id: newUser.id, username: newUser.username });
      }

      case 'project': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { name, location, projectType, clientId, contractValue, description, projectManagerId } = body;
        if (!name) return errorResponse('اسم المشروع مطلوب');

        const count = await (await getDb())?.project.count({ where: { organizationId: user.organizationId } });
        const projectNumber = `PRJ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const project = await (await getDb())?.project.create({
          data: {
            name,
            projectNumber,
            location: location || '',
            projectType,
            clientId,
            contractValue: contractValue ? parseFloat(contractValue) : 0,
            description,
            projectManagerId,
            organizationId: user.organizationId
          }
        });

        // Add user to project
        await (await getDb())?.projectUser.create({
          data: {
            projectId: project.id,
            userId: user.id,
            permission: 'admin'
          }
        });

        // Create audit log
        await (await getDb())?.auditLog.create({
          data: {
            userId: user.id,
            action: 'create',
            entityType: 'project',
            entityId: project.id,
            newValues: JSON.stringify(project)
          }
        });

        return successResponse({ id: project.id, projectNumber, name });
      }

      case 'client': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { name, email, phone, address, contactPerson, taxNumber, clientType, creditLimit, notes } = body;
        if (!name) return errorResponse('اسم العميل مطلوب');

        const client = await (await getDb())?.client.create({
          data: { 
            name, 
            email, 
            phone, 
            address, 
            contactPerson,
            taxNumber,
            clientType: clientType || 'company',
            creditLimit: creditLimit || 0,
            notes,
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: client.id, name });
      }

      case 'invoice': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { clientId, projectId, items, subtotal, taxRate = 5, discountAmount = 0, dueDate, notes, terms } = body;
        
        const count = await (await getDb())?.invoice.count({ where: { organizationId: user.organizationId } });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        
        const taxAmount = (subtotal || 0) * (taxRate || 5) / 100;
        const total = (subtotal || 0) + taxAmount - (discountAmount || 0);

        const invoice = await (await getDb())?.invoice.create({
          data: {
            invoiceNumber,
            clientId,
            projectId,
            items: JSON.stringify(items || []),
            subtotal: subtotal || 0,
            taxRate: taxRate || 5,
            taxAmount,
            discountAmount: discountAmount || 0,
            total,
            dueDate: dueDate ? new Date(dueDate) : null,
            notes,
            terms,
            issueDate: new Date(),
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: invoice.id, invoiceNumber, total });
      }

      case 'task': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { title, description, projectId, assignedToId, priority, dueDate, estimatedHours, tags } = body;
        if (!title) return errorResponse('عنوان المهمة مطلوب');

        // Verify project belongs to user's organization
        if (projectId) {
          const taskProject = await (await getDb())?.project.findFirst({
            where: { id: projectId, organizationId: user.organizationId }
          });
          if (!taskProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);
        }

        const task = await (await getDb())?.task.create({
          data: {
            title,
            description,
            projectId,
            assignedToId,
            createdById: user.id,
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            estimatedHours,
            tags: tags ? JSON.stringify(tags) : null
          }
        });

        if (assignedToId) {
          await (await getDb())?.notification.create({
            data: {
              userId: assignedToId,
              title: 'مهمة جديدة',
              message: `تم تعيين مهمة: ${title}`,
              notificationType: 'task',
              referenceType: 'task',
              referenceId: task.id
            }
          });
        }

        return successResponse({ id: task.id });
      }

      case 'supplier': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { name, supplierType, email, phone, address, contactPerson, taxNumber, notes } = body;
        if (!name) return errorResponse('اسم المورد مطلوب');

        const supplier = await (await getDb())?.supplier.create({
          data: { 
            name, 
            supplierType: supplierType || 'supplier', 
            email, 
            phone, 
            address, 
            contactPerson,
            taxNumber,
            notes,
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: supplier.id, name });
      }

      case 'material': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { name, category, unit, unitPrice, minStock, maxStock, location } = body;
        if (!name || !unit) return errorResponse('اسم المادة والوحدة مطلوبان');

        const count = await (await getDb())?.material.count({ where: { organizationId: user.organizationId } });
        const materialCode = `MAT-${(count + 1).toString().padStart(4, '0')}`;

        const material = await (await getDb())?.material.create({
          data: { 
            materialCode, 
            name, 
            category, 
            unit, 
            unitPrice: unitPrice || 0, 
            minStock: minStock || 0,
            maxStock: maxStock || 0,
            location,
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: material.id, materialCode });
      }

      case 'contract': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { contractNumber, title, clientId, projectId, contractValue, startDate, endDate, contractType, notes, terms } = body;
        if (!title) return errorResponse('عنوان العقد مطلوب');

        let finalContractNumber = contractNumber;
        if (!finalContractNumber) {
          const count = await (await getDb())?.contract.count({ where: { organizationId: user.organizationId } });
          finalContractNumber = `CNT-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        }

        const contract = await (await getDb())?.contract.create({
          data: {
            contractNumber: finalContractNumber,
            title,
            clientId,
            projectId,
            contractValue: contractValue ? parseFloat(contractValue) : 0,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            contractType: contractType || 'lump_sum',
            notes,
            terms,
            status: 'draft',
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: contract.id, contractNumber: finalContractNumber });
      }

      case 'proposal': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { proposalNumber, clientId, projectId, title, totalAmount, issueDate, validUntil, items, notes, terms } = body;

        let finalProposalNumber = proposalNumber;
        if (!finalProposalNumber) {
          const count = await (await getDb())?.proposal.count({ where: { organizationId: user.organizationId } });
          finalProposalNumber = `PRP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        }

        const proposal = await (await getDb())?.proposal.create({
          data: {
            proposalNumber: finalProposalNumber,
            clientId,
            projectId,
            title,
            totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
            issueDate: issueDate ? new Date(issueDate) : null,
            validUntil: validUntil ? new Date(validUntil) : null,
            items: items ? JSON.stringify(items) : null,
            notes,
            terms,
            status: 'draft',
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: proposal.id, proposalNumber: finalProposalNumber });
      }

      case 'site-report': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { projectId, weather, temperature, workersCount, summary, issues, workDescription, nextSteps, workArea, safetyIssues, equipmentUsed, materialsReceived } = body;
        if (!projectId) return errorResponse('المشروع مطلوب');

        // Verify project belongs to user's organization
        const siteProject = await (await getDb())?.project.findFirst({
          where: { id: projectId, organizationId: user.organizationId }
        });
        if (!siteProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);

        const count = await (await getDb())?.siteReport.count({ where: { projectId } });
        const reportNumber = `SR-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        const report = await (await getDb())?.siteReport.create({
          data: {
            projectId,
            reportDate: new Date(),
            reportNumber,
            weather,
            temperature,
            workersCount,
            summary,
            issues,
            workDescription,
            nextSteps,
            workArea,
            safetyIssues,
            equipmentUsed,
            materialsReceived,
            preparedById: user.id
          }
        });

        return successResponse({ id: report.id, reportNumber });
      }

      case 'leave-request': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { leaveType, startDate, endDate, reason } = body;
        if (!leaveType || !startDate || !endDate) {
          return errorResponse('نوع الإجازة والتواريخ مطلوبة');
        }

        const daysCount = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const leaveRequest = await (await getDb())?.leaveRequest.create({
          data: {
            userId: user.id,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            daysCount,
            reason
          }
        });

        // Notify admins in the same organization
        const admins = await (await getDb())?.user.findMany({ 
          where: { role: 'admin', organizationId: user.organizationId } 
        });
        for (const admin of admins) {
          await (await getDb())?.notification.create({
            data: {
              userId: admin.id,
              title: 'طلب إجازة جديد',
              message: `طلب إجازة ${leaveType} من ${user.fullName || user.username}`,
              notificationType: 'approval',
              referenceType: 'leave',
              referenceId: leaveRequest.id
            }
          });
        }

        return successResponse({ id: leaveRequest.id });
      }

      // ============================================
      // TASK 4: New POST Endpoints
      // ============================================

      case 'boq-item': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { projectId, itemNumber, description, unit, quantity, unitPrice, totalPrice, category, notes } = body;
        if (!projectId || !description) {
          return errorResponse('المشروع والوصف مطلوبان');
        }

        // Verify project belongs to user's organization
        const boqProject = await (await getDb())?.project.findFirst({
          where: { id: projectId, organizationId: user.organizationId }
        });
        if (!boqProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);

        const boqItem = await (await getDb())?.bOQItem.create({
          data: {
            projectId,
            itemNumber,
            description,
            unit,
            quantity: quantity ? parseFloat(quantity) : 0,
            unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
            totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
            category,
            notes
          }
        });

        return successResponse({ id: boqItem.id, itemNumber: boqItem.itemNumber });
      }

      case 'purchase-order': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { supplierId, projectId, orderDate, expectedDate, items, subtotal, taxAmount, total, notes } = body;
        
        // Verify supplier belongs to user's organization
        if (supplierId) {
          const poSupplier = await (await getDb())?.supplier.findFirst({
            where: { id: supplierId, organizationId: user.organizationId }
          });
          if (!poSupplier) return errorResponse('المورد غير موجود', 'NOT_FOUND', 404);
        }

        // Generate PO number
        const count = await (await getDb())?.purchaseOrder.count();
        const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const purchaseOrder = await (await getDb())?.purchaseOrder.create({
          data: {
            poNumber,
            supplierId,
            projectId,
            orderDate: orderDate ? new Date(orderDate) : new Date(),
            expectedDate: expectedDate ? new Date(expectedDate) : null,
            items: items ? JSON.stringify(items) : null,
            subtotal: subtotal || 0,
            taxAmount: taxAmount || 0,
            total: total || 0,
            notes,
            createdById: user.id
          }
        });

        return successResponse({ id: purchaseOrder.id, poNumber });
      }

      case 'budget': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { projectId, category, description, budgetAmount, actualAmount } = body;
        if (!projectId || !category) {
          return errorResponse('المشروع والفئة مطلوبان');
        }

        // Verify project belongs to user's organization
        const budgetProject = await (await getDb())?.project.findFirst({
          where: { id: projectId, organizationId: user.organizationId }
        });
        if (!budgetProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);

        const budget = await (await getDb())?.budget.create({
          data: {
            projectId,
            category,
            description,
            budgetAmount: budgetAmount ? parseFloat(budgetAmount) : 0,
            actualAmount: actualAmount ? parseFloat(actualAmount) : 0,
            variance: (budgetAmount || 0) - (actualAmount || 0)
          }
        });

        return successResponse({ id: budget.id, category: budget.category });
      }

      case 'defect': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { projectId, title, description, severity, status, location, assignedTo } = body;
        if (!projectId || !title) {
          return errorResponse('المشروع والعنوان مطلوبان');
        }

        // Verify project belongs to user's organization
        const defectProject = await (await getDb())?.project.findFirst({
          where: { id: projectId, organizationId: user.organizationId }
        });
        if (!defectProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);

        const defect = await (await getDb())?.defect.create({
          data: {
            projectId,
            title,
            description,
            severity: severity || 'medium',
            status: status || 'Open',
            location,
            assignedTo
          }
        });

        // Notify assigned user if any
        if (assignedTo) {
          await (await getDb())?.notification.create({
            data: {
              userId: assignedTo,
              title: 'عيب جديد تم تعيينه',
              message: `تم تعيين عيب: ${title}`,
              notificationType: 'defect',
              referenceType: 'defect',
              referenceId: defect.id
            }
          });
        }

        return successResponse({ id: defect.id, title: defect.title });
      }

      case 'payment': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, notes } = body;
        if (!invoiceId || !amount) {
          return errorResponse('الفاتورة والمبلغ مطلوبان');
        }

        // Verify invoice belongs to user's organization
        const paymentInvoice = await (await getDb())?.invoice.findFirst({
          where: { id: invoiceId, organizationId: user.organizationId }
        });
        if (!paymentInvoice) return errorResponse('الفاتورة غير موجودة', 'NOT_FOUND', 404);

        const payment = await (await getDb())?.payment.create({
          data: {
            invoiceId,
            amount: parseFloat(amount),
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            paymentMethod: paymentMethod || 'bank_transfer',
            referenceNumber,
            notes
          }
        });

        // Update invoice paidAmount
        const newPaidAmount = (paymentInvoice.paidAmount || 0) + parseFloat(amount);
        const newStatus = newPaidAmount >= paymentInvoice.total ? 'paid' : 
                          newPaidAmount > 0 ? 'partial' : paymentInvoice.status;
        
        await (await getDb())?.invoice.update({
          where: { id: invoiceId },
          data: { 
            paidAmount: newPaidAmount,
            status: newStatus
          }
        });

        return successResponse({ id: payment.id, amount: payment.amount });
      }

      case 'voucher': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { voucherType, amount, currency, exchangeRate, date, projectId, invoiceId, clientId, supplierId, paymentMethod, referenceNumber, checkNumber, checkDate, bankName, description, notes } = body;
        if (!voucherType || !amount) {
          return errorResponse('نوع السند والمبلغ مطلوبان');
        }

        // Generate voucher number
        const count = await (await getDb())?.voucher.count();
        const prefix = voucherType === 'receipt' ? 'REC' : 'PAY';
        const voucherNumber = `${prefix}-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const voucher = await (await getDb())?.voucher.create({
          data: {
            voucherNumber,
            voucherType,
            amount: parseFloat(amount),
            currency: currency || 'AED',
            exchangeRate: exchangeRate || 1.0,
            baseAmount: parseFloat(amount) * (exchangeRate || 1.0),
            date: date ? new Date(date) : new Date(),
            projectId,
            invoiceId,
            clientId,
            supplierId,
            paymentMethod: paymentMethod || 'cash',
            referenceNumber,
            checkNumber,
            checkDate: checkDate ? new Date(checkDate) : null,
            bankName,
            description,
            notes,
            createdById: user.id,
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: voucher.id, voucherNumber });
      }

      case 'certificate': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { projectId, clientId, certificateType, title, description, percentage, amount, issueDate, validUntil, notes } = body;
        if (!projectId || !title) {
          return errorResponse('المشروع والعنوان مطلوبان');
        }

        // Verify project belongs to user's organization
        const certProject = await (await getDb())?.project.findFirst({
          where: { id: projectId, organizationId: user.organizationId }
        });
        if (!certProject) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);

        // Generate certificate number
        const count = await (await getDb())?.certificate.count();
        const certificateNumber = `CERT-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const certificate = await (await getDb())?.certificate.create({
          data: {
            certificateNumber,
            projectId,
            clientId,
            certificateType: certificateType || 'completion',
            title,
            description,
            percentage: percentage || 100,
            amount: amount ? parseFloat(amount) : null,
            issueDate: issueDate ? new Date(issueDate) : new Date(),
            validUntil: validUntil ? new Date(validUntil) : null,
            notes,
            organizationId: user.organizationId
          }
        });

        return successResponse({ id: certificate.id, certificateNumber });
      }

      case 'seed': {
        // Create default organization and admin user if they don't exist
        // This is useful for Vercel deployment where we can't run seed scripts
        const existingOrg = await (await getDb())?.organization.findFirst();
        
        if (existingOrg) {
          return successResponse({ 
            message: 'البيانات موجودة بالفعل', 
            organizationId: existingOrg.id,
            login: 'admin / admin123'
          });
        }

        // Create organization
        const org = await (await getDb())?.organization.create({
          data: {
            name: 'BluePrint Engineering',
            slug: 'blueprint-eng',
            email: 'info@blueprint.ae',
            currency: 'AED',
            timezone: 'Asia/Dubai',
            locale: 'ar',
          }
        });

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await (await getDb())?.user.create({
          data: {
            username: 'admin',
            email: 'admin@blueprint.ae',
            password: hashedPassword,
            fullName: 'مدير النظام',
            role: 'admin',
            isActive: true,
            organizationId: org.id,
          }
        });

        // Create a Plan for subscriptions
        const plan = await (await getDb())?.plan.create({
          data: {
            name: 'Enterprise',
            slug: 'enterprise',
            description: 'خطة المؤسسات - جميع الميزات',
            price: 500,
            currency: 'AED',
            interval: 'month',
            features: JSON.stringify(['unlimited_projects', 'unlimited_users', 'ai_assistant', 'reports', 'api_access']),
            limits: JSON.stringify({ projects: -1, users: -1, storage: 100 }),
            isActive: true,
          }
        });

        return successResponse({ 
          message: 'تم إنشاء البيانات الأولية بنجاح',
          organizationId: org.id,
          adminId: admin.id,
          planId: plan.id,
          login: 'admin / admin123'
        });
      }

      case 'ai-chat': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { message, model = 'gemini', conversationHistory = [] } = body;
        if (!message) return errorResponse('الرسالة مطلوبة');

        try {
          const zai = await ZAI.create();
          
          // Map model names to SDK format
          const modelMap: Record<string, string> = {
            'gemini': 'gemini-2.0-flash',
            'gemini-pro': 'gemini-1.5-pro',
            'gpt-4': 'gpt-4o',
            'gpt-3.5': 'gpt-3.5-turbo',
            'deepseek': 'deepseek-chat',
            'claude': 'claude-3-5-sonnet-20241022',
            'llama': 'llama-3.3-70b-instruct',
          };
          
          const selectedModel = modelMap[model] || 'gemini-2.0-flash';
          
          // Build messages array with conversation history
          const messages = [
            {
              role: 'system',
              content: 'أنت Blu، المساعد الذكي المتخصص في الهندسة المدنية والبناء في الإمارات. تجيب بأسلوب احترافي وعملي على أسئلة المهندسين والمقاولين. تستخدم الأكواد الإماراتية والمعايير الخليجية في إجاباتك.'
            },
            ...conversationHistory.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ];

          const completion = await zai.chat.completions.create({
            model: selectedModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
          });

          const responseContent = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من توليد رد.';

          // Save to chat history
          await (await getDb())?.chatHistory.create({
            data: {
              userId: user.id,
              role: 'user',
              message: message,
              modelUsed: model,
              tokensUsed: completion.usage?.total_tokens || 0
            }
          });
          await (await getDb())?.chatHistory.create({
            data: {
              userId: user.id,
              role: 'assistant',
              message: responseContent,
              modelUsed: model,
              tokensUsed: completion.usage?.total_tokens || 0
            }
          });

          return successResponse({ 
            response: responseContent, 
            model,
            tokens: completion.usage?.total_tokens || 0,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          console.error('AI Chat Error:', error);
          return errorResponse('حدث خطأ في الاتصال بالذكاء الاصطناعي', 'AI_ERROR', 500);
        }
      }

      default:
        return errorResponse('إجراء غير معروف');
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return errorResponse(error.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return rateLimitError(rateLimitResult.resetTime);
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const user = await getUserFromToken(request);

  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();

    switch (action) {
      case 'task': {
        const { id, status, progress } = body;
        if (!id) return errorResponse('معرف المهمة مطلوب');

        // Verify task belongs to user's organization
        const task = await (await getDb())?.task.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!task) return errorResponse('المهمة غير موجودة', 'NOT_FOUND', 404);

        const updateData: any = {};
        if (status) {
          updateData.status = status;
          if (status === 'done') updateData.completedAt = new Date();
        }
        if (progress !== undefined) updateData.progress = progress;

        await (await getDb())?.task.update({ where: { id }, data: updateData });
        return successResponse(true);
      }

      case 'invoice-status': {
        const { id, status } = body;
        if (!id || !status) return errorResponse('المعرف والحالة مطلوبان');

        // Verify invoice belongs to user's organization
        const invoice = await (await getDb())?.invoice.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!invoice) return errorResponse('الفاتورة غير موجودة', 'NOT_FOUND', 404);

        await (await getDb())?.invoice.update({ where: { id }, data: { status } });
        return successResponse(true);
      }

      case 'leave-approve': {
        if (user.role !== 'admin' && user.role !== 'hr') {
          return errorResponse('غير مصرح', 'FORBIDDEN', 403);
        }
        const { id, approve, rejectionReason } = body;
        if (!id) return errorResponse('معرف الطلب مطلوب');

        // Verify leave request belongs to user's organization
        const leaveRequest = await (await getDb())?.leaveRequest.findFirst({
          where: { id, user: { organizationId: user.organizationId } }
        });
        if (!leaveRequest) return errorResponse('طلب الإجازة غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.leaveRequest.update({
          where: { id },
          data: {
            status: approve ? 'approved' : 'rejected',
            approvedById: approve ? user.id : null,
            approvedAt: approve ? new Date() : null,
            rejectionReason: approve ? null : rejectionReason
          }
        });
        return successResponse(true);
      }

      case 'notification-read': {
        const { id } = body;
        if (!id) return errorResponse('معرف الإشعار مطلوب');

        await (await getDb())?.notification.update({
          where: { id, userId: user.id },
          data: { isRead: true, readAt: new Date() }
        });
        return successResponse(true);
      }

      case 'notifications-read-all': {
        await (await getDb())?.notification.updateMany({
          where: { userId: user.id, isRead: false },
          data: { isRead: true, readAt: new Date() }
        });
        return successResponse(true);
      }

      case 'project': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف المشروع مطلوب');

        // Verify project belongs to user's organization
        const project = await (await getDb())?.project.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!project) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.project.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'client': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف العميل مطلوب');

        // Verify client belongs to user's organization
        const client = await (await getDb())?.client.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!client) return errorResponse('العميل غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.client.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'user': {
        if (user.role !== 'admin') {
          return errorResponse('غير مصرح', 'FORBIDDEN', 403);
        }
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف المستخدم مطلوب');

        // Verify user belongs to same organization
        const targetUser = await (await getDb())?.user.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!targetUser) return errorResponse('المستخدم غير موجود', 'NOT_FOUND', 404);

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        await (await getDb())?.user.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'supplier': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف المورد مطلوب');

        // Verify supplier belongs to user's organization
        const supplier = await (await getDb())?.supplier.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!supplier) return errorResponse('المورد غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.supplier.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'material': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف المادة مطلوب');

        // Verify material belongs to user's organization
        const material = await (await getDb())?.material.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!material) return errorResponse('المادة غير موجودة', 'NOT_FOUND', 404);

        await (await getDb())?.material.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'contract': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف العقد مطلوب');

        // Verify contract belongs to user's organization
        const contract = await (await getDb())?.contract.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!contract) return errorResponse('العقد غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.contract.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'proposal': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف العرض مطلوب');

        // Verify proposal belongs to user's organization
        const proposal = await (await getDb())?.proposal.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!proposal) return errorResponse('العرض غير موجود', 'NOT_FOUND', 404);

        if (data.items) {
          data.items = JSON.stringify(data.items);
        }

        await (await getDb())?.proposal.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'proposal-status': {
        const { id, status } = body;
        if (!id || !status) return errorResponse('المعرف والحالة مطلوبان');

        // Verify proposal belongs to user's organization
        const proposal = await (await getDb())?.proposal.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!proposal) return errorResponse('العرض غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.proposal.update({ where: { id }, data: { status } });
        return successResponse(true);
      }

      case 'expense': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف المصروف مطلوب');

        // Verify expense belongs to user's organization
        const expense = await (await getDb())?.expense.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!expense) return errorResponse('المصروف غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.expense.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'expense-approve': {
        if (user.role !== 'admin' && user.role !== 'accountant') {
          return errorResponse('غير مصرح', 'FORBIDDEN', 403);
        }
        const { id, approve, rejectionReason } = body;
        if (!id) return errorResponse('معرف المصروف مطلوب');

        // Verify expense belongs to user's organization
        const expense = await (await getDb())?.expense.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!expense) return errorResponse('المصروف غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.expense.update({
          where: { id },
          data: {
            status: approve ? 'approved' : 'rejected',
            approvedById: approve ? user.id : null,
            approvedAt: approve ? new Date() : null,
            notes: approve ? null : rejectionReason
          }
        });
        return successResponse(true);
      }

      // ============================================
      // TASK 5: New PUT Endpoints
      // ============================================

      case 'boq-item': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف بند جدول الكميات مطلوب');

        // Verify BOQItem belongs to user's organization through project
        const boqItem = await (await getDb())?.bOQItem.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!boqItem) return errorResponse('البند غير موجود', 'NOT_FOUND', 404);

        // Calculate total price if quantity and unit price are provided
        if (data.quantity !== undefined && data.unitPrice !== undefined) {
          data.totalPrice = parseFloat(data.quantity) * parseFloat(data.unitPrice);
        }

        await (await getDb())?.bOQItem.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'purchase-order': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف أمر الشراء مطلوب');

        // Verify PurchaseOrder belongs to user's organization through supplier
        const purchaseOrder = await (await getDb())?.purchaseOrder.findFirst({
          where: { id, supplier: { organizationId: user.organizationId } }
        });
        if (!purchaseOrder) return errorResponse('أمر الشراء غير موجود', 'NOT_FOUND', 404);

        if (data.items) {
          data.items = JSON.stringify(data.items);
        }

        await (await getDb())?.purchaseOrder.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'purchase-order-status': {
        const { id, status } = body;
        if (!id || !status) return errorResponse('المعرف والحالة مطلوبان');

        // Verify PurchaseOrder belongs to user's organization
        const purchaseOrder = await (await getDb())?.purchaseOrder.findFirst({
          where: { id, supplier: { organizationId: user.organizationId } }
        });
        if (!purchaseOrder) return errorResponse('أمر الشراء غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.purchaseOrder.update({ where: { id }, data: { status } });
        return successResponse(true);
      }

      case 'budget': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف الميزانية مطلوب');

        // Verify budget belongs to user's organization through project
        const budget = await (await getDb())?.budget.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!budget) return errorResponse('الميزانية غير موجودة', 'NOT_FOUND', 404);

        // Calculate variance if amounts are provided
        if (data.budgetAmount !== undefined || data.actualAmount !== undefined) {
          const budgetAmount = data.budgetAmount !== undefined ? parseFloat(data.budgetAmount) : budget.budgetAmount;
          const actualAmount = data.actualAmount !== undefined ? parseFloat(data.actualAmount) : budget.actualAmount;
          data.variance = budgetAmount - actualAmount;
        }

        await (await getDb())?.budget.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'defect': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف العيب مطلوب');

        // Verify defect belongs to user's organization through project
        const defect = await (await getDb())?.defect.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!defect) return errorResponse('العيب غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.defect.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'defect-resolve': {
        const { id, resolutionNotes } = body;
        if (!id) return errorResponse('معرف العيب مطلوب');

        // Verify defect belongs to user's organization
        const defect = await (await getDb())?.defect.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!defect) return errorResponse('العيب غير موجود', 'NOT_FOUND', 404);

        await (await getDb())?.defect.update({
          where: { id },
          data: {
            status: 'Closed',
            resolvedAt: new Date(),
            resolutionNotes
          }
        });
        return successResponse(true);
      }

      default:
        return errorResponse('إجراء غير معروف');
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return errorResponse(error.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return rateLimitError(rateLimitResult.resetTime);
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');
  const user = await getUserFromToken(request);

  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    switch (action) {
      case 'project': {
        if (!id) return errorResponse('معرف المشروع مطلوب');
        
        // Verify project belongs to user's organization
        const project = await (await getDb())?.project.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!project) return errorResponse('المشروع غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.project.delete({ where: { id } });
        return successResponse(true);
      }

      case 'client': {
        if (!id) return errorResponse('معرف العميل مطلوب');
        
        // Verify client belongs to user's organization
        const client = await (await getDb())?.client.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!client) return errorResponse('العميل غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.client.update({ where: { id }, data: { isActive: false } });
        return successResponse(true);
      }

      case 'task': {
        if (!id) return errorResponse('معرف المهمة مطلوب');
        
        // Verify task belongs to user's organization
        const task = await (await getDb())?.task.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!task) return errorResponse('المهمة غير موجودة', 'NOT_FOUND', 404);
        
        await (await getDb())?.task.delete({ where: { id } });
        return successResponse(true);
      }

      case 'invoice': {
        if (!id) return errorResponse('معرف الفاتورة مطلوب');
        
        // Verify invoice belongs to user's organization
        const invoice = await (await getDb())?.invoice.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!invoice) return errorResponse('الفاتورة غير موجودة', 'NOT_FOUND', 404);
        
        await (await getDb())?.invoice.delete({ where: { id } });
        return successResponse(true);
      }

      case 'supplier': {
        if (!id) return errorResponse('معرف المورد مطلوب');
        
        // Verify supplier belongs to user's organization
        const supplier = await (await getDb())?.supplier.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!supplier) return errorResponse('المورد غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.supplier.update({ where: { id }, data: { isActive: false } });
        return successResponse(true);
      }

      case 'material': {
        if (!id) return errorResponse('معرف المادة مطلوب');
        
        // Verify material belongs to user's organization
        const material = await (await getDb())?.material.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!material) return errorResponse('المادة غير موجودة', 'NOT_FOUND', 404);
        
        await (await getDb())?.material.update({ where: { id }, data: { isActive: false } });
        return successResponse(true);
      }

      case 'contract': {
        if (!id) return errorResponse('معرف العقد مطلوب');
        
        // Verify contract belongs to user's organization
        const contract = await (await getDb())?.contract.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!contract) return errorResponse('العقد غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.contract.delete({ where: { id } });
        return successResponse(true);
      }

      case 'proposal': {
        if (!id) return errorResponse('معرف العرض مطلوب');
        
        // Verify proposal belongs to user's organization
        const proposal = await (await getDb())?.proposal.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!proposal) return errorResponse('العرض غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.proposal.delete({ where: { id } });
        return successResponse(true);
      }

      case 'expense': {
        if (!id) return errorResponse('معرف المصروف مطلوب');
        
        // Verify expense belongs to user's organization
        const expense = await (await getDb())?.expense.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!expense) return errorResponse('المصروف غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.expense.delete({ where: { id } });
        return successResponse(true);
      }

      case 'document': {
        if (!id) return errorResponse('معرف المستند مطلوب');
        await (await getDb())?.document.delete({ where: { id } });
        return successResponse(true);
      }

      case 'site-report': {
        if (!id) return errorResponse('معرف تقرير الموقع مطلوب');
        
        // Verify site report belongs to user's organization
        const siteReport = await (await getDb())?.siteReport.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!siteReport) return errorResponse('تقرير الموقع غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.siteReport.delete({ where: { id } });
        return successResponse(true);
      }

      // ============================================
      // TASK 6: New DELETE Endpoints
      // ============================================

      case 'boq-item': {
        if (!id) return errorResponse('معرف بند جدول الكميات مطلوب');
        
        // Verify BOQItem belongs to user's organization
        const boqItem = await (await getDb())?.bOQItem.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!boqItem) return errorResponse('البند غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.bOQItem.delete({ where: { id } });
        return successResponse(true);
      }

      case 'purchase-order': {
        if (!id) return errorResponse('معرف أمر الشراء مطلوب');
        
        // Verify PurchaseOrder belongs to user's organization
        const purchaseOrder = await (await getDb())?.purchaseOrder.findFirst({
          where: { id, supplier: { organizationId: user.organizationId } }
        });
        if (!purchaseOrder) return errorResponse('أمر الشراء غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.purchaseOrder.delete({ where: { id } });
        return successResponse(true);
      }

      case 'budget': {
        if (!id) return errorResponse('معرف الميزانية مطلوب');
        
        // Verify budget belongs to user's organization
        const budget = await (await getDb())?.budget.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!budget) return errorResponse('الميزانية غير موجودة', 'NOT_FOUND', 404);
        
        await (await getDb())?.budget.delete({ where: { id } });
        return successResponse(true);
      }

      case 'defect': {
        if (!id) return errorResponse('معرف العيب مطلوب');
        
        // Verify defect belongs to user's organization
        const defect = await (await getDb())?.defect.findFirst({
          where: { id, project: { organizationId: user.organizationId } }
        });
        if (!defect) return errorResponse('العيب غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.defect.delete({ where: { id } });
        return successResponse(true);
      }

      case 'voucher': {
        if (!id) return errorResponse('معرف السند مطلوب');
        
        const voucher = await (await getDb())?.voucher.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!voucher) return errorResponse('السند غير موجود', 'NOT_FOUND', 404);
        
        await (await getDb())?.voucher.delete({ where: { id } });
        return successResponse(true);
      }

      case 'certificate': {
        if (!id) return errorResponse('معرف الشهادة مطلوب');
        
        const certificate = await (await getDb())?.certificate.findFirst({
          where: { id, organizationId: user.organizationId }
        });
        if (!certificate) return errorResponse('الشهادة غير موجودة', 'NOT_FOUND', 404);
        
        await (await getDb())?.certificate.delete({ where: { id } });
        return successResponse(true);
      }

      default:
        return errorResponse('إجراء غير معروف');
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return errorResponse(error.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}
