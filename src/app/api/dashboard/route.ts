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
      totalClients, totalInvoices, totalPaid, taskCounts,
      openDefectsCount, resolvedDefects, criticalDefects, totalEmployees
    ] = await Promise.all([
      db.project.count({ where: { organizationId: orgId } }),
      db.project.count({ where: { status: 'ACTIVE', organizationId: orgId } }),
      db.project.count({ where: { status: 'COMPLETED', organizationId: orgId } }),
      db.project.count({ where: { status: 'PENDING', organizationId: orgId } }),
      db.client.count({ where: { isActive: true, organizationId: orgId } }),
      db.invoice.aggregate({ where: { organizationId: orgId }, _sum: { total: true } }),
      db.invoice.aggregate({ where: { organizationId: orgId }, _sum: { paidAmount: true } }),
      db.task.groupBy({
        by: ['status'],
        where: { project: { organizationId: orgId } },
        _count: true
      }),
      db.defect.count({ where: { status: 'OPEN', project: { organizationId: orgId } } }),
      db.defect.count({ where: { status: 'CLOSED', project: { organizationId: orgId } } }),
      db.defect.count({ where: { status: 'OPEN', severity: 'CRITICAL', project: { organizationId: orgId } } }),
      db.user.count({ where: { isActive: true, organizationId: orgId } })
    ]);

    // Build task count map from groupBy result (avoids N+1 separate count queries)
    const taskCountMap = Object.fromEntries(taskCounts.map(t => [t.status, t._count]));

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
          total: Object.values(taskCountMap).reduce((sum, c) => sum + c, 0),
          pending: taskCountMap['TODO'] || 0,
          inProgress: taskCountMap['IN_PROGRESS'] || 0,
          completed: taskCountMap['DONE'] || 0,
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
