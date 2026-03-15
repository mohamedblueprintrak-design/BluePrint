import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-secret-key-2024-secure');

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
    const user = await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });
    return user;
  } catch {
    return null;
  }
}

// GET handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const user = await getUserFromToken(request);

  try {
    switch (action) {
      case 'health':
        return successResponse({ status: 'ok', version: '3.0.0', timestamp: new Date().toISOString() });

      case 'me':
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        return successResponse({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar,
          language: user.language,
          theme: user.theme,
          organization: user.organization
        });

      case 'users':
        if (!user || user.role !== 'admin') {
          return errorResponse('غير مصرح', 'FORBIDDEN', 403);
        }
        const users = await db.user.findMany({
          select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
        });
        return successResponse(users);

      case 'projects':
        const allProjects = await db.project.findMany({ 
          include: { client: true }, 
          orderBy: { createdAt: 'desc' } 
        });
        return successResponse(allProjects.map(p => ({
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
        const projectId = searchParams.get('id');
        if (!projectId) return errorResponse('معرف المشروع مطلوب');
        const project = await db.project.findUnique({
          where: { id: projectId },
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
        const clients = await db.client.findMany({
          where: { isActive: true },
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
        const invoices = await db.invoice.findMany({
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
        const taskProjectId = searchParams.get('projectId');
        const taskStatus = searchParams.get('status');
        const tasksQuery: any = {};
        if (taskProjectId) tasksQuery.projectId = taskProjectId;
        if (taskStatus) tasksQuery.status = taskStatus;
        
        const tasks = await db.task.findMany({
          where: tasksQuery,
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
        const suppliers = await db.supplier.findMany({
          where: { isActive: true },
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
        const materials = await db.material.findMany({
          where: { isActive: true },
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
        const contracts = await db.contract.findMany({
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
        const proposals = await db.proposal.findMany({
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
        const siteReports = await db.siteReport.findMany({
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
        const documents = await db.document.findMany({
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
        const notifications = await db.notification.findMany({
          where: { 
            userId: user.id,
            ...(unreadOnly && { isRead: false })
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });
        return successResponse(notifications);

      case 'leave-requests':
        const leaveStatus = searchParams.get('status');
        const leaveRequests = await db.leaveRequest.findMany({
          where: leaveStatus ? { status: leaveStatus } : {},
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
        const attUserId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const attendanceWhere: any = {};
        if (attUserId) attendanceWhere.userId = attUserId;
        if (startDate) attendanceWhere.date = { gte: new Date(startDate) };
        if (endDate) attendanceWhere.date = { ...attendanceWhere.date, lte: new Date(endDate) };
        
        const attendance = await db.attendance.findMany({
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

      case 'dashboard':
        const totalProjects = await db.project.count();
        const activeProjects = await db.project.count({ where: { status: 'active' } });
        const completedProjects = await db.project.count({ where: { status: 'completed' } });
        const pendingProjects = await db.project.count({ where: { status: 'pending' } });
        const totalClients = await db.client.count({ where: { isActive: true } });
        const totalInvoices = await db.invoice.aggregate({ _sum: { total: true } });
        const totalPaid = await db.invoice.aggregate({ _sum: { paidAmount: true } });
        const pendingTasks = await db.task.count({ where: { status: { not: 'done' } } });
        const inProgressTasks = await db.task.count({ where: { status: 'in_progress' } });
        const completedTasks = await db.task.count({ where: { status: 'done' } });
        const openDefectsCount = await db.defect.count({ where: { status: 'Open' } });
        const resolvedDefects = await db.defect.count({ where: { status: 'Closed' } });
        const criticalDefects = await db.defect.count({ where: { status: 'Open', severity: 'critical' } });
        const totalEmployees = await db.user.count({ where: { isActive: true } });
        
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
            overdueAmount: 0 // TODO: Calculate overdue invoices
          },
          tasks: { 
            total: pendingTasks + completedTasks,
            pending: await db.task.count({ where: { status: 'todo' } }),
            inProgress: inProgressTasks,
            completed: completedTasks,
            overdue: 0 // TODO: Calculate overdue tasks
          },
          defects: { 
            open: openDefectsCount,
            resolved: resolvedDefects,
            critical: criticalDefects
          },
          employees: {
            total: totalEmployees,
            presentToday: 0, // TODO: Calculate today's attendance
            onLeave: 0 // TODO: Calculate employees on leave
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

        const foundUser = await db.user.findFirst({
          where: {
            OR: [
              { username },
              { email: username }
            ]
          }
        });

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

        // Update last login
        await db.user.update({
          where: { id: foundUser.id },
          data: { lastLoginAt: new Date() }
        });

        const token = await new jose.SignJWT({ userId: foundUser.id })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('8h')
          .setIssuedAt()
          .sign(JWT_SECRET);
        return successResponse({ accessToken: token, tokenType: 'bearer' });
      }

      case 'register': {
        const { username, email, password, fullName, role = 'viewer' } = body;
        if (!username || !email || !password) {
          return errorResponse('جميع الحقول مطلوبة');
        }

        if (password.length < 6) {
          return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        const existing = await db.user.findFirst({
          where: { OR: [{ username }, { email }] }
        });

        if (existing) {
          return errorResponse('المستخدم موجود بالفعل');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            fullName: fullName || username,
            role
          }
        });

        return successResponse({ id: newUser.id, username: newUser.username });
      }

      case 'project': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { name, location, projectType, clientId, contractValue, description, projectManagerId } = body;
        if (!name) return errorResponse('اسم المشروع مطلوب');

        const count = await db.project.count();
        const projectNumber = `PRJ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const project = await db.project.create({
          data: {
            name,
            projectNumber,
            location: location || '',
            projectType,
            clientId,
            contractValue: contractValue ? parseFloat(contractValue) : 0,
            description,
            projectManagerId
          }
        });

        // Add user to project
        await db.projectUser.create({
          data: {
            projectId: project.id,
            userId: user.id,
            permission: 'admin'
          }
        });

        // Create audit log
        await db.auditLog.create({
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

        const client = await db.client.create({
          data: { 
            name, 
            email, 
            phone, 
            address, 
            contactPerson,
            taxNumber,
            clientType: clientType || 'company',
            creditLimit: creditLimit || 0,
            notes
          }
        });

        return successResponse({ id: client.id, name });
      }

      case 'invoice': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { clientId, projectId, items, subtotal, taxRate = 5, discountAmount = 0, dueDate, notes, terms } = body;
        
        const count = await db.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        
        const taxAmount = (subtotal || 0) * (taxRate || 5) / 100;
        const total = (subtotal || 0) + taxAmount - (discountAmount || 0);

        const invoice = await db.invoice.create({
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
            issueDate: new Date()
          }
        });

        return successResponse({ id: invoice.id, invoiceNumber, total });
      }

      case 'task': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { title, description, projectId, assignedToId, priority, dueDate, estimatedHours, tags } = body;
        if (!title) return errorResponse('عنوان المهمة مطلوب');

        const task = await db.task.create({
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
          await db.notification.create({
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

        const supplier = await db.supplier.create({
          data: { 
            name, 
            supplierType: supplierType || 'supplier', 
            email, 
            phone, 
            address, 
            contactPerson,
            taxNumber,
            notes
          }
        });

        return successResponse({ id: supplier.id, name });
      }

      case 'material': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { name, category, unit, unitPrice, minStock, maxStock, location } = body;
        if (!name || !unit) return errorResponse('اسم المادة والوحدة مطلوبان');

        const count = await db.material.count();
        const materialCode = `MAT-${(count + 1).toString().padStart(4, '0')}`;

        const material = await db.material.create({
          data: { 
            materialCode, 
            name, 
            category, 
            unit, 
            unitPrice: unitPrice || 0, 
            minStock: minStock || 0,
            maxStock: maxStock || 0,
            location
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
          const count = await db.contract.count();
          finalContractNumber = `CNT-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        }

        const contract = await db.contract.create({
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
            status: 'draft'
          }
        });

        return successResponse({ id: contract.id, contractNumber: finalContractNumber });
      }

      case 'proposal': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { proposalNumber, clientId, projectId, title, totalAmount, issueDate, validUntil, items, notes, terms } = body;

        let finalProposalNumber = proposalNumber;
        if (!finalProposalNumber) {
          const count = await db.proposal.count();
          finalProposalNumber = `PRP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        }

        const proposal = await db.proposal.create({
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
            status: 'draft'
          }
        });

        return successResponse({ id: proposal.id, proposalNumber: finalProposalNumber });
      }

      case 'site-report': {
        if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
        const { projectId, weather, temperature, workersCount, summary, issues, workDescription, nextSteps, workArea, safetyIssues, equipmentUsed, materialsReceived } = body;
        if (!projectId) return errorResponse('المشروع مطلوب');

        const count = await db.siteReport.count({ where: { projectId } });
        const reportNumber = `SR-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        const report = await db.siteReport.create({
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

        const leaveRequest = await db.leaveRequest.create({
          data: {
            userId: user.id,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            daysCount,
            reason
          }
        });

        // Notify admins
        const admins = await db.user.findMany({ where: { role: 'admin' } });
        for (const admin of admins) {
          await db.notification.create({
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

      case 'ai-chat': {
        const { message, model = 'gemini' } = body;
        if (!message) return errorResponse('الرسالة مطلوبة');

        // Simulated AI responses based on keywords
        const responses: Record<string, string> = {
          'كمرة': 'لتصميم كمرة: العمق التقريبي = البحر × 10 سم. مثلاً كمرة ببحر 6 متر تحتاج عمق ~60 سم وعرض 25-30 سم.',
          'خرسانة': 'مقاومة الخرسانة الدنيا في الإمارات: fcu = 25 N/mm². نسبة الماء/الأسمنت w/c ≤ 0.45 للعناصر الإنشائية. فترة المعالجة: 7 أيام كحد أدنى.',
          'حديد': 'التسليح المستخدم: Grade 60 (fy = 420 N/mm²). نسبة التسليح الدنيا للكمرات: 0.25%، للأعمدة: 1%.',
          'سعر': 'أسعار 2024-2025: الخرسانة C25 = 280-350 درهم/م³، حديد التسليح = 2,500-3,000 درهم/طن، طوب الإسمنت = 0.8-1.2 درهم/حبة.',
          'أساس': 'قدرة تحمل التربة: رملية كثيفة 300-500 kN/m²، صخرية 500-1000 kN/m²، Sabkha 50-100 kN/m² (تحتاج معالجة).',
          'زلزال': 'الإمارات في منطقة زلزالية منخفضة-متوسطة (SDC B). تسارع الأرض الاحتمالي: 0.05g إلى 0.15g.',
          'حمل': 'الأحمال الحية: سكني 2.0 kN/m²، مكاتب 2.5 kN/m²، مستودعات 5.0 kN/m². الحمل الميت للخرسانة المسلحة: 25 kN/m³.',
          'vat': 'ضريبة القيمة المضافة في الإمارات: 5%. رقم التسجيل الضريبي TRN إلزامي للمعاملات فوق 10,000 درهم.',
        };
        
        let response = 'شكراً على سؤالك! أنا Blu المساعد الذكي. يمكنني مساعدتك في الأسئلة الهندسية وحسابات البناء وأكواد الإمارات.';
        
        const messageLower = message.toLowerCase();
        for (const [key, value] of Object.entries(responses)) {
          if (messageLower.includes(key)) {
            response = value;
            break;
          }
        }

        return successResponse({ 
          response, 
          model,
          tokens: message.split().length + 50,
          timestamp: new Date().toISOString()
        });
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

        const updateData: any = {};
        if (status) {
          updateData.status = status;
          if (status === 'done') updateData.completedAt = new Date();
        }
        if (progress !== undefined) updateData.progress = progress;

        await db.task.update({ where: { id }, data: updateData });
        return successResponse(true);
      }

      case 'invoice-status': {
        const { id, status } = body;
        if (!id || !status) return errorResponse('المعرف والحالة مطلوبان');

        await db.invoice.update({ where: { id }, data: { status } });
        return successResponse(true);
      }

      case 'leave-approve': {
        if (user.role !== 'admin' && user.role !== 'hr') {
          return errorResponse('غير مصرح', 'FORBIDDEN', 403);
        }
        const { id, approve, rejectionReason } = body;
        if (!id) return errorResponse('معرف الطلب مطلوب');

        await db.leaveRequest.update({
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

        await db.notification.update({
          where: { id, userId: user.id },
          data: { isRead: true, readAt: new Date() }
        });
        return successResponse(true);
      }

      case 'notifications-read-all': {
        await db.notification.updateMany({
          where: { userId: user.id, isRead: false },
          data: { isRead: true, readAt: new Date() }
        });
        return successResponse(true);
      }

      case 'project': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف المشروع مطلوب');

        await db.project.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'client': {
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف العميل مطلوب');

        await db.client.update({ where: { id }, data });
        return successResponse(true);
      }

      case 'user': {
        if (user.role !== 'admin') {
          return errorResponse('غير مصرح', 'FORBIDDEN', 403);
        }
        const { id, ...data } = body;
        if (!id) return errorResponse('معرف المستخدم مطلوب');

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        await db.user.update({ where: { id }, data });
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
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');
  const user = await getUserFromToken(request);

  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    switch (action) {
      case 'project': {
        if (!id) return errorResponse('معرف المشروع مطلوب');
        await db.project.delete({ where: { id } });
        return successResponse(true);
      }

      case 'client': {
        if (!id) return errorResponse('معرف العميل مطلوب');
        await db.client.update({ where: { id }, data: { isActive: false } });
        return successResponse(true);
      }

      case 'task': {
        if (!id) return errorResponse('معرف المهمة مطلوب');
        await db.task.delete({ where: { id } });
        return successResponse(true);
      }

      case 'invoice': {
        if (!id) return errorResponse('معرف الفاتورة مطلوب');
        await db.invoice.delete({ where: { id } });
        return successResponse(true);
      }

      case 'supplier': {
        if (!id) return errorResponse('معرف المورد مطلوب');
        await db.supplier.update({ where: { id }, data: { isActive: false } });
        return successResponse(true);
      }

      case 'material': {
        if (!id) return errorResponse('معرف المادة مطلوب');
        await db.material.update({ where: { id }, data: { isActive: false } });
        return successResponse(true);
      }

      case 'contract': {
        if (!id) return errorResponse('معرف العقد مطلوب');
        await db.contract.delete({ where: { id } });
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
