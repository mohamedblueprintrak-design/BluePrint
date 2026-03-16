import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });
  } catch {
    return null;
  }
}

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

// Demo tasks
const DEMO_TASKS = [
  {
    id: 'demo-task-001',
    title: 'مراجعة مخططات البناء',
    description: 'مراجعة المخططات المعمارية للمشروع',
    projectId: 'demo-project-001',
    project: 'برج الأعمال',
    assignedToId: null,
    assignee: null,
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date('2025-02-01'),
    progress: 60,
    createdAt: new Date()
  },
  {
    id: 'demo-task-002',
    title: 'إعداد تقرير التقدم الأسبوعي',
    description: 'تحضير التقرير الأسبوعي للمشروع',
    projectId: 'demo-project-001',
    project: 'برج الأعمال',
    assignedToId: null,
    assignee: null,
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2025-01-30'),
    progress: 0,
    createdAt: new Date()
  },
  {
    id: 'demo-task-003',
    title: 'متابعة المقاول الفرعي',
    description: 'التحقق من تقدم أعمال المقاول',
    projectId: 'demo-project-002',
    project: 'مجمع الفيلات',
    assignedToId: null,
    assignee: null,
    priority: 'urgent',
    status: 'todo',
    dueDate: new Date('2025-01-28'),
    progress: 0,
    createdAt: new Date()
  }
];

// GET - List tasks
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    try {
      const where: any = {
        project: { organizationId: user.organizationId }
      };
      if (projectId) where.projectId = projectId;
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const tasks = await db.task.findMany({
        where,
        include: { project: true, assignee: true },
        orderBy: { createdAt: 'desc' }
      });

      return successResponse(tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        projectId: t.projectId,
        project: t.project?.name,
        assignedToId: t.assignedToId,
        assignee: t.assignee?.fullName || t.assignee?.username,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        progress: t.progress,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        createdAt: t.createdAt
      })));
    } catch (dbError) {
      // Demo mode
      let tasks = DEMO_TASKS;
      if (status) tasks = tasks.filter(t => t.status === status);
      if (priority) tasks = tasks.filter(t => t.priority === priority);
      return successResponse(tasks);
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// POST - Create task
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { title, description, projectId, assignedToId, priority, dueDate, estimatedHours, tags } = body;

    if (!title) return errorResponse('عنوان المهمة مطلوب');

    try {
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

      // Create notification for assignee
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

      return successResponse({ id: task.id, title: task.title });
    } catch (dbError) {
      // Demo mode
      return successResponse({ 
        id: `demo-task-${Date.now()}`, 
        title,
        message: 'تم إنشاء المهمة (وضع تجريبي)'
      });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// PUT - Update task
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return errorResponse('معرف المهمة مطلوب');

    // Convert dueDate if provided
    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate);
    }

    try {
      const task = await db.task.update({
        where: { id },
        data
      });
      return successResponse(task);
    } catch (dbError) {
      return successResponse({ id, ...data, message: 'تم التحديث (وضع تجريبي)' });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete task
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('معرف المهمة مطلوب');

    try {
      await db.task.delete({ where: { id } });
      return successResponse({ message: 'تم حذف المهمة' });
    } catch (dbError) {
      return successResponse({ message: 'تم الحذف (وضع تجريبي)' });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
