import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
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

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.organizationId) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'غير مصرح' } }, { status: 401 });
  }

  const orgId = user.organizationId;

  try {
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
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
