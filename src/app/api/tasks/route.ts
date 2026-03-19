/**
 * Tasks API Route
 * مسار واجهة برمجة التطبيقات للمهام
 * 
 * Handles CRUD operations for tasks
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse
} from '../utils/response';
import { taskService } from '@/lib/services';
import { prisma } from '@/lib/db';

/**
 * GET - List tasks
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || undefined;
  const status = searchParams.get('status') || undefined;
  const priority = searchParams.get('priority') || undefined;

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let tasks = [...DEMO_DATA.tasks];
    if (projectId) tasks = tasks.filter(t => t.projectId === projectId);
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    return successResponse(tasks);
  }

  try {
    const result = await taskService.getTasks(
      user.organizationId!,
      { projectId, status, priority },
      {}
    );

    return successResponse(result.data.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      project: (t as any).project?.name,
      assignedTo: t.assignedTo,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      progress: t.progress,
      estimatedHours: t.estimatedHours,
      actualHours: t.actualHours,
      createdAt: t.createdAt
    })));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * POST - Create task
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot create tasks
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء مهام في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();
    const { title, description, projectId, assignedTo, priority, dueDate, estimatedHours } = body;

    if (!title) {
      return validationErrorResponse('عنوان المهمة مطلوب');
    }

    const task = await taskService.createTask(
      {
        title,
        description,
        projectId,
        assignedTo,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours,
      },
      user.organizationId,
      user.id
    );

    // Create notification for assignee
    if (assignedTo) {
      try {
        await prisma.notification.create({
          data: {
            userId: assignedTo,
            title: 'مهمة جديدة',
            message: `تم تعيين مهمة: ${title}`,
            notificationType: 'task',
            referenceType: 'task',
            referenceId: task.id
          }
        });
      } catch (notifError) {
        console.error('Failed to create task notification:', notifError);
      }
    }

    return successResponse({ id: task.id, title: task.title });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * PUT - Update task
 */
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot update tasks
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن تحديث المهام في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return validationErrorResponse('معرف المهمة مطلوب');
    }

    // Convert dueDate if provided
    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate);
    }

    const task = await taskService.updateTask(id, data, user.organizationId, user.id);
    return successResponse(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return notFoundResponse('المهمة غير موجودة أو ليس لديك صلاحية لتعديلها');
    }
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * DELETE - Delete task
 */
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot delete tasks
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف المهام في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return validationErrorResponse('معرف المهمة مطلوب');
    }

    await taskService.deleteTask(id, user.organizationId, user.id);
    return successResponse({ message: 'تم حذف المهمة' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return notFoundResponse('المهمة غير موجودة أو ليس لديك صلاحية لحذفها');
    }
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
