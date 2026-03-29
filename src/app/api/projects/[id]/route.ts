import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '../utils/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get single project with full details
// Returns project with all related data: phases, interactions, tasks, invoices, boq, defects, siteReports
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            currency: true,
            language: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            website: true,
            address: true,
            contactPerson: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        // Project phases
        phases: {
          include: {
            milestones: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        milestones: {
          orderBy: { dueDate: 'asc' },
        },
        // Workflow phases
        workflowPhases: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
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
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Tasks
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            reporter: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Invoices
        invoices: {
          include: {
            client: {
              select: { id: true, name: true, company: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // BOQ Items
        boqItems: {
          orderBy: [{ order: 'asc' }, { category: 'asc' }],
        },
        // Defects
        defects: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            reportedBy: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            siteReport: {
              select: { id: true, date: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Site Reports
        siteReports: {
          include: {
            reportedBy: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { date: 'desc' },
        },
        // Contracts
        contracts: {
          include: {
            client: { select: { id: true, name: true, company: true } },
            supplier: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Documents
        documents: {
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
            folder: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Materials
        materials: {
          include: {
            supplier: { select: { id: true, name: true } },
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
      todo: project.tasks.filter((t) => t.status === 'TODO').length,
      inProgress: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      inReview: project.tasks.filter((t) => t.status === 'IN_REVIEW').length,
      done: project.tasks.filter((t) => t.status === 'DONE').length,
      cancelled: project.tasks.filter((t) => t.status === 'CANCELLED').length,
    };

    const workflowStats = {
      total: project.workflowPhases.length,
      notStarted: project.workflowPhases.filter((p) => p.status === 'NOT_STARTED').length,
      inProgress: project.workflowPhases.filter((p) => p.status === 'IN_PROGRESS').length,
      completed: project.workflowPhases.filter((p) => p.status === 'COMPLETED').length,
      onHold: project.workflowPhases.filter((p) => p.status === 'ON_HOLD').length,
      delayed: project.workflowPhases.filter((p) => p.status === 'DELAYED').length,
      rejected: project.workflowPhases.filter((p) => p.status === 'REJECTED').length,
    };

    const invoiceStats = {
      total: project.invoices.length,
      draft: project.invoices.filter((i) => i.status === 'DRAFT').length,
      sent: project.invoices.filter((i) => i.status === 'SENT').length,
      paid: project.invoices.filter((i) => i.status === 'PAID').length,
      partiallyPaid: project.invoices.filter((i) => i.status === 'PARTIALLY_PAID').length,
      overdue: project.invoices.filter((i) => i.status === 'OVERDUE').length,
      totalAmount: project.invoices.reduce((sum, i) => sum + i.total, 0),
      totalPaid: project.invoices.reduce((sum, i) => sum + i.paidAmount, 0),
      totalOutstanding: project.invoices.reduce((sum, i) => sum + (i.total - i.paidAmount), 0),
    };

    const defectStats = {
      total: project.defects.length,
      open: project.defects.filter((d) => d.status === 'OPEN').length,
      inProgress: project.defects.filter((d) => d.status === 'IN_PROGRESS').length,
      resolved: project.defects.filter((d) => d.status === 'RESOLVED').length,
      closed: project.defects.filter((d) => d.status === 'CLOSED').length,
      critical: project.defects.filter((d) => d.severity === 'CRITICAL').length,
    };

    const boqStats = {
      total: project.boqItems.length,
      totalValue: project.boqItems.reduce((sum, i) => sum + i.totalPrice, 0),
      categories: [...new Set(project.boqItems.map((i) => i.category).filter(Boolean))],
    };

    const interactionStats = {
      total: project.clientInteractions.length,
      approve: project.clientInteractions.filter((i) => i.interactionType === 'APPROVE').length,
      reject: project.clientInteractions.filter((i) => i.interactionType === 'REJECT').length,
      comment: project.clientInteractions.filter((i) => i.interactionType === 'COMMENT').length,
    };

    // Task progress
    const taskProgress =
      taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

    // Workflow progress
    const workflowProgress =
      workflowStats.total > 0 ? Math.round((workflowStats.completed / workflowStats.total) * 100) : 0;

    // Milestone progress
    const milestoneStats = {
      total: project.milestones.length,
      completed: project.milestones.filter((m) => m.isCompleted).length,
    };
    const milestoneProgress =
      milestoneStats.total > 0 ? Math.round((milestoneStats.completed / milestoneStats.total) * 100) : 0;

    return successResponse({
      ...project,
      taskStats,
      workflowStats,
      invoiceStats,
      defectStats,
      boqStats,
      interactionStats,
      milestoneStats,
      taskProgress,
      workflowProgress,
      milestoneProgress,
    });
  } catch (error) {
    console.error('Project [id] GET error:', error);
    return serverErrorResponse();
  }
}
