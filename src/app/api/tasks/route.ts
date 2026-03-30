/**
 * Tasks API Route
 * مسار واجهة برمجة التطبيقات للمهام
 * 
 * Handles CRUD operations for tasks
 * 
 * SECURITY:
 * - All endpoints require authentication
 * - Organization isolation enforced via taskService
 * - Input validation to prevent Mass Assignment
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
import { taskService, TaskAccessError } from '@/lib/services/task.service';
import { prisma } from '@/lib/db';
import { cachedQuery, invalidateCache, buildCacheKey, CACHE_TTL } from '@/lib/cache/query-cache';

/**
 * GET - List tasks
 * Returns all tasks for the user's organization
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || undefined;
  const parentId = searchParams.get('parentId') || undefined;
  const status = searchParams.get('status') || undefined;
  const priority = searchParams.get('priority') || undefined;

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let tasks = [...DEMO_DATA.tasks];
    if (projectId) tasks = tasks.filter(t => t.projectId === projectId);
    if (parentId) tasks = tasks.filter((t: any) => t.parentId === parentId);
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    return successResponse(tasks);
  }

  // Require organization for real users
  if (!user.organizationId) {
    return errorResponse('المستخدم غير مرتبط بمؤسسة', 'NO_ORGANIZATION', 403);
  }

  try {
    const cacheKey = buildCacheKey('tasks', 'list', user.organizationId || '', 'pid', projectId || '', 'parentId', parentId || '', 's', status || '', 'pr', priority || '');
    const result = await cachedQuery(
      cacheKey,
      () => taskService.getTasks(
        user.organizationId!,
        { projectId, parentId, status, priority },
        {}
      ),
      CACHE_TTL.TASKS
    );

    return successResponse(result.data.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      project: (t as { project?: { name?: string } }).project?.name,
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
 * SECURITY: Validates input fields explicitly
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
    
    // SECURITY: Explicit field extraction to prevent Mass Assignment
    const { 
      title, 
      description, 
      projectId, 
      parentId,
      assignedTo, 
      priority, 
      status,
      startDate,
      endDate,
      dueDate, 
      estimatedHours,
      isMilestone,
      color
    } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return validationErrorResponse('عنوان المهمة مطلوب');
    }

    if (title.length > 500) {
      return validationErrorResponse('عنوان المهمة يجب أن يكون أقل من 500 حرف');
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return validationErrorResponse('الأولية يجب أن تكون: low, medium, high, أو critical');
    }

    // Validate status if provided
    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return validationErrorResponse('الحالة يجب أن تكون: todo, in_progress, review, done, أو cancelled');
    }

    const task = await taskService.createTask(
      {
        title: title.trim(),
        description: description?.trim(),
        projectId,
        parentId,
        assignedTo,
        priority: priority || 'medium',
        status: status || 'todo',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        isMilestone: isMilestone === true,
        color,
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

    // Invalidate task and project caches on creation
    await invalidateCache('tasks', 'projects');
  } catch (error) {
    if (error instanceof TaskAccessError) {
      return notFoundResponse(error.message);
    }
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * PUT - Update task
 * SECURITY:
 * - Validates input fields explicitly (prevents Mass Assignment)
 * - Organization isolation enforced via taskService
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
    const { id } = body;

    if (!id) {
      return validationErrorResponse('معرف المهمة مطلوب');
    }

    // SECURITY: Explicit field extraction to prevent Mass Assignment
    // Only allow specific fields to be updated
    const allowedFields = [
      'title', 'description', 'projectId', 'parentId', 'assignedTo',
      'priority', 'status', 'startDate', 'endDate', 'dueDate',
      'progress', 'estimatedHours', 'actualHours', 'isMilestone',
      'color', 'dependencies', 'order'
    ];

    const updateData: Record<string, unknown> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convert date fields
        if (['startDate', 'endDate', 'dueDate'].includes(field) && body[field]) {
          updateData[field] = new Date(body[field]);
        }
        // Convert numeric fields
        else if (['progress', 'estimatedHours', 'actualHours', 'order'].includes(field)) {
          updateData[field] = Number(body[field]);
        }
        // Convert boolean fields
        else if (field === 'isMilestone') {
          updateData[field] = body[field] === true;
        }
        // String fields
        else {
          updateData[field] = body[field];
        }
      }
    }

    // Validate title if provided
    if (updateData.title !== undefined) {
      if (typeof updateData.title !== 'string' || (updateData.title as string).trim().length === 0) {
        return validationErrorResponse('عنوان المهمة يجب أن يكون نص غير فارغ');
      }
      if ((updateData.title as string).length > 500) {
        return validationErrorResponse('عنوان المهمة يجب أن يكون أقل من 500 حرف');
      }
      updateData.title = (updateData.title as string).trim();
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (updateData.priority && !validPriorities.includes(updateData.priority as string)) {
      return validationErrorResponse('الأولية يجب أن تكون: low, medium, high, أو critical');
    }

    // Validate status if provided
    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
    if (updateData.status && !validStatuses.includes(updateData.status as string)) {
      return validationErrorResponse('الحالة يجب أن تكون: todo, in_progress, review, done, أو cancelled');
    }

    // Validate progress range
    if (updateData.progress !== undefined) {
      const progress = Number(updateData.progress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return validationErrorResponse('التقدم يجب أن يكون رقم بين 0 و 100');
      }
      updateData.progress = progress;
    }

    const task = await taskService.updateTask(id, updateData, user.organizationId, user.id);
    
    // Invalidate task and project caches on update
    await invalidateCache('tasks', 'projects');
    return successResponse(task);
  } catch (error) {
    if (error instanceof TaskAccessError) {
      return notFoundResponse(error.message);
    }
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * DELETE - Delete task
 * SECURITY: Organization isolation enforced via taskService
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
    
    // Invalidate task and project caches on delete
    await invalidateCache('tasks', 'projects');
    return successResponse({ message: 'تم حذف المهمة' });
  } catch (error) {
    if (error instanceof TaskAccessError) {
      return notFoundResponse(error.message);
    }
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
