import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'غير مصرح' } }, { status: 401 });
  }

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    return NextResponse.json({
      success: true,
      data: DEMO_DATA.dashboard
    });
  }

  // Real database queries for actual users
  try {
    const { db } = await import('@/lib/db');
    const orgId = user.organizationId;

    // Parallel queries for better performance
    const [
      totalProjects, activeProjects, completedProjects, pendingProjects,
      totalClients, totalInvoices, totalPaid, pendingTasks, inProgressTasks,
      completedTasks, openDefectsCount, resolvedDefects, criticalDefects, totalEmployees
    ] = await Promise.all([
      db.project.count({ where: { organizationId: orgId } }),
      db.project.count({ where: { status: 'active', organizationId: orgId } }),
      db.project.count({ where: { status: 'completed', organizationId: orgId } }),
      db.project.count({ where: { status: 'pending', organizationId: orgId } }),
      db.client.count({ where: { isActive: true, organizationId: orgId } }),
      db.invoice.aggregate({ where: { organizationId: orgId }, _sum: { total: true } }),
      db.invoice.aggregate({ where: { organizationId: orgId }, _sum: { paidAmount: true } }),
      db.task.count({ where: { status: { not: 'done' }, project: { organizationId: orgId } } }),
      db.task.count({ where: { status: 'in_progress', project: { organizationId: orgId } } }),
      db.task.count({ where: { status: 'done', project: { organizationId: orgId } } }),
      db.defect.count({ where: { status: 'Open', project: { organizationId: orgId } } }),
      db.defect.count({ where: { status: 'Closed', project: { organizationId: orgId } } }),
      db.defect.count({ where: { status: 'Open', severity: 'critical', project: { organizationId: orgId } } }),
      db.user.count({ where: { isActive: true, organizationId: orgId } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
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
          pending: await db.task.count({ where: { status: 'todo', project: { organizationId: user.organizationId } } }),
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
      }
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}
