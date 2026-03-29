import { NextRequest } from 'next/server';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  try {
    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        role: { not: 'VIEWER' },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatar: true,
        role: true,
        department: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Get task counts and details per user
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: { in: users.map(u => u.id) },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
      select: {
        assignedTo: true,
        status: true,
        priority: true,
        dueDate: true,
        progress: true,
        projectId: true,
        estimatedHours: true,
        actualHours: true,
      },
    });

    // Build workload map
    const workloadMap = new Map<string, {
      totalTasks: number;
      todoTasks: number;
      inProgressTasks: number;
      reviewTasks: number;
      doneTasks: number;
      overdueTasks: number;
      highPriorityTasks: number;
      totalEstimatedHours: number;
      totalActualHours: number;
      completionRate: number;
      pressureScore: number; // 0-100
    }>();

    // Initialize
    for (const u of users) {
      workloadMap.set(u.id, {
        totalTasks: 0, todoTasks: 0, inProgressTasks: 0, reviewTasks: 0, doneTasks: 0,
        overdueTasks: 0, highPriorityTasks: 0, totalEstimatedHours: 0, totalActualHours: 0,
        completionRate: 0, pressureScore: 0,
      });
    }

    // Aggregate
    for (const task of tasks) {
      const w = workloadMap.get(task.assignedTo!);
      if (!w) continue;
      w.totalTasks++;
      w.totalEstimatedHours += task.estimatedHours || 0;
      w.totalActualHours += task.actualHours || 0;

      if (task.status === 'TODO') w.todoTasks++;
      else if (task.status === 'IN_PROGRESS') w.inProgressTasks++;
      else if (task.status === 'REVIEW') w.reviewTasks++;
      else if (task.status === 'DONE') w.doneTasks++;

      if (task.priority === 'HIGH' || task.priority === 'URGENT') w.highPriorityTasks++;
      if (task.dueDate && task.dueDate < now && task.status !== 'DONE') w.overdueTasks++;
    }

    // Calculate derived metrics
    const workloadData = users.map(u => {
      const w = workloadMap.get(u.id)!;
      w.completionRate = w.totalTasks > 0 ? Math.round((w.doneTasks / w.totalTasks) * 100) : 0;

      // Pressure score: weighted combination of overdue, high priority, and in-progress tasks
      const overdueWeight = w.overdueTasks * 30;
      const highPriorityWeight = w.highPriorityTasks * 15;
      const activeWeight = w.inProgressTasks * 10;
      const reviewWeight = w.reviewTasks * 5;
      w.pressureScore = Math.min(100, Math.round(overdueWeight + highPriorityWeight + activeWeight + reviewWeight));

      return {
        userId: u.id,
        fullName: u.fullName || u.username,
        avatar: u.avatar,
        role: u.role,
        department: u.department,
        ...w,
      };
    });

    // Sort by pressure score descending
    workloadData.sort((a, b) => b.pressureScore - a.pressureScore);

    // Summary stats
    const summary = {
      totalEmployees: users.length,
      overloadedEmployees: workloadData.filter(w => w.pressureScore >= 70).length,
      totalActiveTasks: tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED').length,
      totalOverdueTasks: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'DONE').length,
      avgCompletionRate: workloadData.length > 0
        ? Math.round(workloadData.reduce((sum, w) => sum + w.completionRate, 0) / workloadData.length)
        : 0,
    };

    return successResponse(workloadData, summary);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
