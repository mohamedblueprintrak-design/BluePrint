/**
 * Task Auto-Creation API
 * POST /api/tasks/auto-create
 *
 * Automatically creates tasks based on phase category templates.
 * Supports ARCHITECTURAL, STRUCTURAL, MEP, and GOVERNMENT phase categories.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, isDemoUser } from '../../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '../../utils/response';

// ============================================
// Task Templates by Phase Category
// ============================================

interface TaskTemplate {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  taskType: 'STANDARD' | 'GOVERNMENTAL' | 'MANDATORY' | 'CLIENT' | 'INTERNAL';
  slaDays: number;
  order: number;
  dependencies: number[]; // orders of tasks this depends on
  governmentEntity?: string;
  color?: string;
}

const PHASE_TEMPLATES: Record<string, TaskTemplate[]> = {
  ARCHITECTURAL: [
    {
      title: 'Preliminary Sketch',
      titleAr: 'المخطط المبدئي',
      description: 'Create preliminary architectural sketches based on client requirements',
      descriptionAr: 'إنشاء المخططات المعمارية المبدئية بناءً على متطلبات العميل',
      taskType: 'STANDARD',
      slaDays: 4,
      order: 1,
      dependencies: [],
      color: '#3b82f6',
    },
    {
      title: 'Concept Design',
      titleAr: 'التصميم المفاهيمي',
      description: 'Develop concept design including floor plans and elevations',
      descriptionAr: 'تطوير التصميم المفاهيمي بما في ذلك المخططات والمواجهات',
      taskType: 'STANDARD',
      slaDays: 14,
      order: 2,
      dependencies: [1],
      color: '#6366f1',
    },
    {
      title: 'Client Approval',
      titleAr: 'موافقة العميل',
      description: 'Submit concept design for client review and approval',
      descriptionAr: 'تقديم التصميم المفاهيمي لمراجعة العميل والموافقة',
      taskType: 'CLIENT',
      slaDays: 3,
      order: 3,
      dependencies: [2],
      color: '#f59e0b',
    },
    {
      title: 'Design Modification',
      titleAr: 'تعديلات التصميم',
      description: 'Incorporate client feedback and modify design accordingly',
      descriptionAr: 'دمج ملاحظات العميل وتعديل التصميم وفقاً لذلك',
      taskType: 'STANDARD',
      slaDays: 4,
      order: 4,
      dependencies: [3],
      color: '#8b5cf6',
    },
    {
      title: 'Preliminary Drawings',
      titleAr: 'المخططات التمهيدية',
      description: 'Prepare preliminary drawings for all disciplines',
      descriptionAr: 'إعداد المخططات التمهيدية لجميع التخصصات',
      taskType: 'STANDARD',
      slaDays: 6,
      order: 5,
      dependencies: [4],
      color: '#06b6d4',
    },
    {
      title: '3D Visualization',
      titleAr: 'التصور ثلاثي الأبعاد',
      description: 'Create 3D renders and visualizations for presentation',
      descriptionAr: 'إنشاء صور تجسيد ثلاثية الأبعاد للعرض',
      taskType: 'STANDARD',
      slaDays: 7,
      order: 6,
      dependencies: [5],
      color: '#10b981',
    },
    {
      title: 'Final Architectural Drawings',
      titleAr: 'المخططات المعمارية النهائية',
      description: 'Produce final architectural drawings for submission',
      descriptionAr: 'إنتاج المخططات المعمارية النهائية للتقديم',
      taskType: 'STANDARD',
      slaDays: 14,
      order: 7,
      dependencies: [6],
      color: '#ec4899',
    },
  ],
  STRUCTURAL: [
    {
      title: 'Soil Investigation Report',
      titleAr: 'تقرير دراسة التربة',
      description: 'Review and verify soil investigation report findings',
      descriptionAr: 'مراجعة والتأكد من نتائج تقرير دراسة التربة',
      taskType: 'MANDATORY',
      slaDays: 21,
      order: 1,
      dependencies: [],
      color: '#ef4444',
    },
    {
      title: 'Structural Calculations',
      titleAr: 'الحسابات الإنشائية',
      description: 'Perform structural analysis and design calculations',
      descriptionAr: 'إجراء التحليل الإنشائي وحسابات التصميم',
      taskType: 'STANDARD',
      slaDays: 21,
      order: 2,
      dependencies: [1],
      color: '#f97316',
    },
    {
      title: 'Structural Drawings',
      titleAr: 'المخططات الإنشائية',
      description: 'Prepare detailed structural drawings and details',
      descriptionAr: 'إعداد المخططات الإنشائية التفصيلية',
      taskType: 'STANDARD',
      slaDays: 14,
      order: 3,
      dependencies: [2],
      color: '#eab308',
    },
  ],
  MEP: [
    {
      title: 'Electrical Design',
      titleAr: 'التصميم الكهربائي',
      description: 'Design electrical systems including power, lighting, and emergency systems',
      descriptionAr: 'تصميم الأنظمة الكهربائية بما في ذلك الطاقة والإضاءة وأنظمة الطوارئ',
      taskType: 'STANDARD',
      slaDays: 14,
      order: 1,
      dependencies: [],
      color: '#f59e0b',
      governmentEntity: 'FEWA',
    },
    {
      title: 'Plumbing Design',
      titleAr: 'التصميم الصحي',
      description: 'Design plumbing and drainage systems',
      descriptionAr: 'تصميم أنظمة السباكة والصرف الصحي',
      taskType: 'STANDARD',
      slaDays: 14,
      order: 2,
      dependencies: [],
      color: '#3b82f6',
    },
    {
      title: 'HVAC Design',
      titleAr: 'تصميم التكييف',
      description: 'Design heating, ventilation, and air conditioning systems',
      descriptionAr: 'تصميم أنظمة التدفئة والتهوية والتكييف',
      taskType: 'STANDARD',
      slaDays: 14,
      order: 3,
      dependencies: [],
      color: '#10b981',
    },
  ],
  CONTRACTING: [
    {
      title: 'Contract Review',
      titleAr: 'مراجعة العقد',
      description: 'Review contract terms, conditions, and scope of work',
      descriptionAr: 'مراجعة شروط العقد والأحكام ونطاق العمل',
      taskType: 'MANDATORY',
      slaDays: 5,
      order: 1,
      dependencies: [],
      color: '#f59e0b',
    },
    {
      title: 'Contract Negotiation',
      titleAr: 'التفاوض على العقد',
      description: 'Negotiate contract terms with contractor',
      descriptionAr: 'التفاوض على شروط العقد مع المقاول',
      taskType: 'STANDARD',
      slaDays: 10,
      order: 2,
      dependencies: [1],
      color: '#6366f1',
    },
    {
      title: 'Contract Signing',
      titleAr: 'توقيع العقد',
      description: 'Finalize and sign the contract with all parties',
      descriptionAr: 'إتمام وتوقيع العقد مع جميع الأطراف',
      taskType: 'CLIENT',
      slaDays: 1,
      order: 3,
      dependencies: [2],
      color: '#10b981',
    },
    {
      title: 'Mobilization Plan',
      titleAr: 'خطة التعبئة',
      description: 'Prepare contractor mobilization and site handover plan',
      descriptionAr: 'إعداد خطة تعبئة المقاول وتسليم الموقع',
      taskType: 'STANDARD',
      slaDays: 7,
      order: 4,
      dependencies: [3],
      color: '#0ea5e9',
    },
  ],
  GOVERNMENT: [
    {
      title: 'Municipality Approval',
      titleAr: 'موافقة البلدية',
      description: 'Submit drawings and documents for municipality approval',
      descriptionAr: 'تقديم المخططات والمستندات لموافقة البلدية',
      taskType: 'GOVERNMENTAL',
      slaDays: 7,
      order: 1,
      dependencies: [],
      governmentEntity: 'Municipality',
      color: '#dc2626',
    },
    {
      title: 'Civil Defense Approval',
      titleAr: 'موافقة الدفاع المدني',
      description: 'Obtain civil defense approval for fire safety and emergency systems',
      descriptionAr: 'الحصول على موافقة الدفاع المدني لأنظمة السلامة والطوارئ',
      taskType: 'GOVERNMENTAL',
      slaDays: 7,
      order: 2,
      dependencies: [1],
      governmentEntity: 'Civil Defense',
      color: '#ef4444',
    },
    {
      title: 'FEWA Connection Approval',
      titleAr: 'موافقة هيئة كهرباء ومياه',
      description: 'Obtain FEWA approval for electrical and water connections',
      descriptionAr: 'الحصول على موافقة هيئة كهرباء ومياه للاتصالات الكهربائية والمائية',
      taskType: 'GOVERNMENTAL',
      slaDays: 30,
      order: 3,
      dependencies: [1],
      governmentEntity: 'FEWA',
      color: '#f59e0b',
    },
    {
      title: 'Telecom/ICT Approval',
      titleAr: 'موافقة الاتصالات',
      description: 'Obtain telecommunications infrastructure approval',
      descriptionAr: 'الحصول على موافقة البنية التحتية للاتصالات',
      taskType: 'GOVERNMENTAL',
      slaDays: 14,
      order: 4,
      dependencies: [1],
      governmentEntity: 'Telecom/ICT',
      color: '#6366f1',
    },
    {
      title: 'Etisalat Approval',
      titleAr: 'اعتماد اتصالات',
      description: 'Obtain Etisalat approval for telecommunications services',
      descriptionAr: 'الحصول على اعتماد اتصالات لخدمات الاتصالات',
      taskType: 'GOVERNMENTAL',
      slaDays: 4,
      order: 5,
      dependencies: [1],
      governmentEntity: 'ETISALAT',
      color: '#0EA5E9',
    },
    {
      title: 'SEWA/DEWA Approval',
      titleAr: 'اعتماد كهرباء ومياه',
      description: 'Obtain SEWA/DEWA approval for electricity and water connections',
      descriptionAr: 'الحصول على اعتماد كهرباء ومياه للاتصالات الكهربائية والمائية',
      taskType: 'GOVERNMENTAL',
      slaDays: 6,
      order: 6,
      dependencies: [1],
      governmentEntity: 'SEWA',
      color: '#F59E0B',
    },
  ],
};

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    if (isDemoUser(user.id)) {
      return errorResponse('Auto-create is not available in demo mode', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const { projectId, phaseId, phaseCategory } = body;

    if (!projectId || !phaseCategory) {
      return errorResponse('projectId and phaseCategory are required');
    }

    // Validate phase category
    const validCategories = ['ARCHITECTURAL', 'STRUCTURAL', 'MEP', 'GOVERNMENT', 'CONTRACTING'];
    if (!validCategories.includes(phaseCategory)) {
      return errorResponse(`Invalid phaseCategory. Must be one of: ${validCategories.join(', ')}`);
    }

    // Get the template for this category
    const templates = PHASE_TEMPLATES[phaseCategory];
    if (!templates || templates.length === 0) {
      return errorResponse(`No task templates found for category: ${phaseCategory}`);
    }

    // Check if the project exists
    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: user.organizationId },
      select: { id: true, name: true, managerId: true },
    });

    if (!project) {
      return errorResponse('Project not found');
    }

    // Check for existing tasks in this phase to avoid duplicates
    const existingTasks = await db.task.findMany({
      where: {
        projectId,
        workflowTemplate: phaseCategory,
        deletedAt: null,
      },
      select: { title: true },
    });

    const existingTitles = new Set(existingTasks.map(t => t.title));

    // Create tasks from template
    const now = new Date();
    const createdTasks: Array<Record<string, unknown>> = [];
    const createdIds: string[] = [];

    for (const template of templates) {
      // Skip if task already exists
      if (existingTitles.has(template.title)) continue;

      const slaStartDate = new Date(now);
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + template.slaDays);

      // Map dependency orders to actual task IDs (will resolve after creation)
      const task = await db.task.create({
        data: {
          projectId,
          title: template.title,
          titleAr: template.titleAr,
          description: template.description,
          taskType: template.taskType,
          slaDays: template.slaDays,
          slaWarningDays: Math.max(1, Math.floor(template.slaDays * 0.2)),
          slaStartDate,
          dueDate,
          order: template.order,
          color: template.color,
          governmentEntity: template.governmentEntity || null,
          workflowTemplate: phaseCategory,
          isMandatory: template.taskType === 'GOVERNMENTAL' || template.taskType === 'MANDATORY',
          status: 'TODO',
          dependencies: template.dependencies.length > 0 ? template.dependencies : undefined,
          assignedTo: project.managerId || null,
        },
      });

      createdIds.push(task.id);
      createdTasks.push({
        id: task.id,
        title: task.title,
        taskType: task.taskType,
        slaDays: task.slaDays,
        order: task.order,
      });
    }

    // Second pass: resolve dependencies to actual task IDs
    // Build a map from template order → created task ID for O(1) lookups
    const orderToId: Record<number, string> = {};
    for (const ct of createdTasks) {
      orderToId[ct.order as number] = ct.id as string;
    }

    for (const template of templates) {
      if (existingTitles.has(template.title)) continue;
      if (template.dependencies.length === 0) continue;

      const createdTaskId = orderToId[template.order];
      if (!createdTaskId) continue;

      // Map dependency order numbers to actual created task IDs
      const dependencyIds: string[] = [];
      for (const depOrder of template.dependencies) {
        const depId = orderToId[depOrder];
        if (depId) {
          dependencyIds.push(depId);
        }
      }

      if (dependencyIds.length > 0) {
        await db.task.update({
          where: { id: createdTaskId },
          data: { dependencies: dependencyIds },
        });
      }
    }

    // Log the activity
    if (phaseId) {
      await db.activity.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          projectId,
          entityType: 'WORKFLOW_PHASE',
          entityId: phaseId,
          action: 'AUTO_CREATE_TASKS',
          description: `Auto-created ${createdTasks.length} tasks for ${phaseCategory} phase`,
          metadata: {
            phaseCategory,
            taskCount: createdTasks.length,
            taskIds: createdIds,
          },
        },
      });
    }

    return successResponse({
      message: `Successfully created ${createdTasks.length} tasks for ${phaseCategory} phase`,
      taskCount: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Task auto-create error:', error);
    return serverErrorResponse();
  }
}
