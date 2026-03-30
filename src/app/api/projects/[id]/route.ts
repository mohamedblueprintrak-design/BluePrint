import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../../utils/demo-config';
import { successResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '../../utils/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get single project with full details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    const project = await db.project.findUnique({
      where: { id, organizationId: user.organizationId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contactPerson: true,
            city: true,
            country: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        // Workflow phases (Engineering OS)
        workflowPhases: {
          include: {
            assignedTo: { select: { id: true, fullName: true, email: true, avatar: true } },
            dependsOn: { select: { id: true, phaseType: true, status: true } },
            dependentPhases: { select: { id: true, phaseType: true, status: true } },
            interactions: {
              select: { id: true, interactionType: true, content: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
            },
            _count: { select: { interactions: true } },
          },
          orderBy: { order: 'asc' },
        },
        // Client interactions
        clientInteractions: {
          include: {
            phase: {
              select: { id: true, phaseType: true, phaseCategory: true, status: true },
            },
            respondedBy: {
              select: { id: true, fullName: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Tasks
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        // Invoices - fetched separately since no direct relation exists on Project
        // BOQ Items
        boqItems: {
          orderBy: { itemNumber: 'asc' },
        },
        // Defects
        defects: {
          orderBy: { createdAt: 'desc' },
        },
        // Site Reports
        siteReports: {
          orderBy: { reportDate: 'desc' },
        },
        // Contracts
        contracts: {
          orderBy: { createdAt: 'desc' },
        },
        // Documents
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        // Risks
        risks: {
          include: {
            riskActions: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return notFoundResponse('Project not found');
    }

    // Compute derived stats
    const taskStats = {
      total: project.tasks.length,
      todo: project.tasks.filter((t: { status: string }) => t.status === 'TODO').length,
      inProgress: project.tasks.filter((t: { status: string }) => t.status === 'IN_PROGRESS').length,
      inReview: project.tasks.filter((t: { status: string }) => t.status === 'REVIEW').length,
      done: project.tasks.filter((t: { status: string }) => t.status === 'DONE').length,
      cancelled: project.tasks.filter((t: { status: string }) => t.status === 'CANCELLED').length,
    };

    const workflowStats = {
      total: project.workflowPhases.length,
      notStarted: project.workflowPhases.filter((p: { status: string }) => p.status === 'NOT_STARTED').length,
      inProgress: project.workflowPhases.filter((p: { status: string }) => p.status === 'IN_PROGRESS').length,
      completed: project.workflowPhases.filter((p: { status: string }) => p.status === 'COMPLETED').length,
      onHold: project.workflowPhases.filter((p: { status: string }) => p.status === 'ON_HOLD').length,
      delayed: project.workflowPhases.filter((p: { status: string }) => p.status === 'DELAYED').length,
      rejected: project.workflowPhases.filter((p: { status: string }) => p.status === 'REJECTED').length,
    };

    // Fetch invoices separately (no direct relation on Project model)
    let projectInvoices: any[] = [];
    try {
      projectInvoices = await db.invoice.findMany({
        where: { projectId: id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Invoices table may not have projectId index
    }

    const invoiceStats = {
      total: projectInvoices.length,
      draft: projectInvoices.filter((i: { status: string }) => i.status === 'DRAFT').length,
      sent: projectInvoices.filter((i: { status: string }) => i.status === 'SENT').length,
      paid: projectInvoices.filter((i: { status: string }) => i.status === 'PAID').length,
      partiallyPaid: projectInvoices.filter((i: { status: string }) => i.status === 'PARTIAL').length,
      overdue: projectInvoices.filter((i: { status: string }) => i.status === 'OVERDUE').length,
      totalAmount: projectInvoices.reduce((sum: number, i: { total: number }) => sum + i.total, 0),
      totalPaid: projectInvoices.reduce((sum: number, i: { paidAmount: number }) => sum + i.paidAmount, 0),
      totalOutstanding: projectInvoices.reduce((sum: number, i: { total: number; paidAmount: number }) => sum + (i.total - i.paidAmount), 0),
    };

    const defectStats = {
      total: project.defects.length,
      open: project.defects.filter((d: { status: string }) => d.status === 'OPEN').length,
      inProgress: project.defects.filter((d: { status: string }) => d.status === 'IN_PROGRESS').length,
      resolved: project.defects.filter((d: { status: string }) => d.status === 'RESOLVED').length,
      closed: project.defects.filter((d: { status: string }) => d.status === 'CLOSED').length,
      critical: project.defects.filter((d: { severity: string }) => d.severity === 'CRITICAL').length,
    };

    const boqStats = {
      total: project.boqItems.length,
      totalValue: project.boqItems.reduce((sum: number, i: { totalPrice: number }) => sum + i.totalPrice, 0),
      categories: [...new Set(project.boqItems.map((i: { category: string | null }) => i.category).filter(Boolean))],
    };

    const interactionStats = {
      total: project.clientInteractions.length,
      approve: project.clientInteractions.filter((i: { interactionType: string }) => i.interactionType === 'APPROVE').length,
      reject: project.clientInteractions.filter((i: { interactionType: string }) => i.interactionType === 'REJECT').length,
      comment: project.clientInteractions.filter((i: { interactionType: string }) => i.interactionType === 'COMMENT').length,
    };

    // Task progress
    const taskProgress =
      taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

    // Workflow progress
    const workflowProgress =
      workflowStats.total > 0 ? Math.round((workflowStats.completed / workflowStats.total) * 100) : 0;

    return successResponse({
      ...project,
      taskStats,
      workflowStats,
      invoiceStats,
      defectStats,
      boqStats,
      interactionStats,
      taskProgress,
      workflowProgress,
    });
  } catch (error) {
    console.error('Project [id] GET error:', error);
    return serverErrorResponse();
  }
}
