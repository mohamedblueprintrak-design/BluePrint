import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';

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

// GET - List tasks
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let tasks = [...DEMO_DATA.tasks];
    if (projectId) tasks = tasks.filter(t => t.projectId === projectId);
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    return successResponse(tasks);
  }

  try {
    const { db } = await import('@/lib/db');
    
    const where: any = {
      project: { organizationId: user.organizationId }
    };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await db.task.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      project: t.project?.name,
      assignedTo: t.assignedTo,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      progress: t.progress,
      estimatedHours: t.estimatedHours,
      actualHours: t.actualHours,
      createdAt: t.createdAt
    })));
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// POST - Create task
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create tasks
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء مهام في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { title, description, projectId, assignedTo, priority, dueDate, estimatedHours } = body;

    if (!title) return errorResponse('عنوان المهمة مطلوب');

    const task = await db.task.create({
      data: {
        title,
        description,
        projectId,
        assignedTo,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
      },
      include: { project: true }
    });

    // Create notification for assignee
    if (assignedTo) {
      try {
        await db.notification.create({
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
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// PUT - Update task
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update tasks
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن تحديث المهام في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return errorResponse('معرف المهمة مطلوب');

    // Convert dueDate if provided
    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate);
    }

    // SECURITY: Verify task belongs to user's organization before updating
    const existingTask = await db.task.findFirst({
      where: { 
        id,
        project: { organizationId: user.organizationId }
      }
    });
    
    if (!existingTask) {
      return errorResponse('المهمة غير موجودة أو ليس لديك صلاحية لتعديلها', 'NOT_FOUND', 404);
    }
    
    const task = await db.task.update({
      where: { id },
      data
    });
    return successResponse(task);
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete task
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete tasks
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف المهام في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('معرف المهمة مطلوب');

    // SECURITY: Verify task belongs to user's organization before deleting
    const existingTask = await db.task.findFirst({
      where: { 
        id,
        project: { organizationId: user.organizationId }
      }
    });
    
    if (!existingTask) {
      return errorResponse('المهمة غير موجودة أو ليس لديك صلاحية لحذفها', 'NOT_FOUND', 404);
    }
    
    await db.task.delete({ where: { id } });
    return successResponse({ message: 'تم حذف المهمة' });
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
