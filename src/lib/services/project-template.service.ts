/**
 * Project Template Service
 * خدمة قوالب المشاريع للاعتمادات الحكومية
 * 
 * This service manages project templates for government approval workflows.
 * Templates define mandatory tasks with SLA requirements that are automatically
 * created when a new project is set up.
 */

import { db, isDatabaseAvailable } from '@/lib/db';
import { TaskType, TaskStatus, TaskPriority } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface CreateProjectFromTemplateInput {
  projectId: string;
  templateCode: string;
  customStartDate?: Date;
  assignedToId?: string;
}

export interface TemplateTaskData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  slaDays: number;
  slaWarningDays?: number;
  estimatedMinutes?: number;
  order: number;
  governmentEntity?: string;
  governmentEntityAr?: string;
  dependencies?: number[];
  color?: string;
}

// ============================================
// Predefined Templates for UAE/Gulf Region
// قوالب محددة مسبقاً لدولة الإمارات والخليج
// ============================================

export const PREDEFINED_TEMPLATES: Record<string, TemplateTaskData[]> = {
  // هيئة كهرباء ومياه - FEWA
  FEWA: [
    {
      name: 'Prepare FEWA Application Documents',
      nameAr: 'إعداد مستندات طلب هيئة الكهرباء',
      slaDays: 3,
      order: 1,
      estimatedMinutes: 480,
      color: '#3B82F6',
    },
    {
      name: 'Submit Application to FEWA',
      nameAr: 'تقديم الطلب لهيئة الكهرباء',
      slaDays: 7,
      order: 2,
      dependencies: [1],
      governmentEntity: 'FEWA - Federal Electricity & Water Authority',
      governmentEntityAr: 'هيئة الكهرباء والماء',
      color: '#3B82F6',
    },
    {
      name: 'FEWA Technical Review',
      nameAr: 'المراجعة الفنية لهيئة الكهرباء',
      slaDays: 14,
      order: 3,
      dependencies: [2],
      governmentEntity: 'FEWA - Federal Electricity & Water Authority',
      governmentEntityAr: 'هيئة الكهرباء والماء',
      color: '#3B82F6',
    },
    {
      name: 'FEWA Site Inspection',
      nameAr: 'معاينة الموقع من هيئة الكهرباء',
      slaDays: 7,
      order: 4,
      dependencies: [3],
      governmentEntity: 'FEWA - Federal Electricity & Water Authority',
      governmentEntityAr: 'هيئة الكهرباء والماء',
      color: '#3B82F6',
    },
    {
      name: 'Obtain FEWA Approval/Connection',
      nameAr: 'الحصول على موافقة/توصيل هيئة الكهرباء',
      slaDays: 7,
      order: 5,
      dependencies: [4],
      governmentEntity: 'FEWA - Federal Electricity & Water Authority',
      governmentEntityAr: 'هيئة الكهرباء والماء',
      color: '#10B981',
    },
  ],

  // الدفاع المدني - Civil Defense
  CIVIL_DEFENSE: [
    {
      name: 'Prepare Civil Defense Drawings',
      nameAr: 'إعداد رسومات الدفاع المدني',
      slaDays: 5,
      order: 1,
      estimatedMinutes: 960,
      color: '#EF4444',
    },
    {
      name: 'Submit to Civil Defense',
      nameAr: 'تقديم للدفاع المدني',
      slaDays: 7,
      order: 2,
      dependencies: [1],
      governmentEntity: 'Civil Defense',
      governmentEntityAr: 'الدفاع المدني',
      color: '#EF4444',
    },
    {
      name: 'Civil Defense Plan Review',
      nameAr: 'مراجعة المخطط من الدفاع المدني',
      slaDays: 14,
      order: 3,
      dependencies: [2],
      governmentEntity: 'Civil Defense',
      governmentEntityAr: 'الدفاع المدني',
      color: '#EF4444',
    },
    {
      name: 'Civil Defense Site Inspection',
      nameAr: 'معاينة الموقع من الدفاع المدني',
      slaDays: 7,
      order: 4,
      dependencies: [3],
      governmentEntity: 'Civil Defense',
      governmentEntityAr: 'الدفاع المدني',
      color: '#EF4444',
    },
    {
      name: 'Obtain Civil Defense Certificate',
      nameAr: 'الحصول على شهادة الدفاع المدني',
      slaDays: 5,
      order: 5,
      dependencies: [4],
      governmentEntity: 'Civil Defense',
      governmentEntityAr: 'الدفاع المدني',
      color: '#10B981',
    },
  ],

  // البلدية - Municipality
  MUNICIPALITY: [
    {
      name: 'Prepare Municipality Permit Documents',
      nameAr: 'إعداد مستندات تصريح البلدية',
      slaDays: 3,
      order: 1,
      estimatedMinutes: 720,
      color: '#8B5CF6',
    },
    {
      name: 'Submit Building Permit Application',
      nameAr: 'تقديم طلب ترخيص بناء',
      slaDays: 5,
      order: 2,
      dependencies: [1],
      governmentEntity: 'Municipality',
      governmentEntityAr: 'البلدية',
      color: '#8B5CF6',
    },
    {
      name: 'Municipality Technical Review',
      nameAr: 'المراجعة الفنية للبلدية',
      slaDays: 21,
      order: 3,
      dependencies: [2],
      governmentEntity: 'Municipality',
      governmentEntityAr: 'البلدية',
      color: '#8B5CF6',
    },
    {
      name: 'Municipality Committee Approval',
      nameAr: 'موافقة لجنة البلدية',
      slaDays: 14,
      order: 4,
      dependencies: [3],
      governmentEntity: 'Municipality',
      governmentEntityAr: 'البلدية',
      color: '#8B5CF6',
    },
    {
      name: 'Issue Building Permit',
      nameAr: 'إصدار رخصة البناء',
      slaDays: 7,
      order: 5,
      dependencies: [4],
      governmentEntity: 'Municipality',
      governmentEntityAr: 'البلدية',
      color: '#10B981',
    },
  ],

  // اتصالات - Etisalat/Telecom
  TELECOM: [
    {
      name: 'Prepare Telecom Connection Application',
      nameAr: 'إعداد طلب توصيل الاتصالات',
      slaDays: 2,
      order: 1,
      estimatedMinutes: 240,
      color: '#06B6D4',
    },
    {
      name: 'Submit to Telecom Provider',
      nameAr: 'تقديم لمزود الاتصالات',
      slaDays: 5,
      order: 2,
      dependencies: [1],
      governmentEntity: 'Etisalat/Du',
      governmentEntityAr: 'اتصالات/دو',
      color: '#06B6D4',
    },
    {
      name: 'Telecom Technical Survey',
      nameAr: 'المسح الفني للاتصالات',
      slaDays: 7,
      order: 3,
      dependencies: [2],
      governmentEntity: 'Etisalat/Du',
      governmentEntityAr: 'اتصالات/دو',
      color: '#06B6D4',
    },
    {
      name: 'Telecom Installation',
      nameAr: 'تركيب خطوط الاتصالات',
      slaDays: 14,
      order: 4,
      dependencies: [3],
      governmentEntity: 'Etisalat/Du',
      governmentEntityAr: 'اتصالات/دو',
      color: '#06B6D4',
    },
    {
      name: 'Telecom Connection Activation',
      nameAr: 'تفعيل خدمة الاتصالات',
      slaDays: 3,
      order: 5,
      dependencies: [4],
      governmentEntity: 'Etisalat/Du',
      governmentEntityAr: 'اتصالات/دو',
      color: '#10B981',
    },
  ],
};

// ============================================
// Template Service Functions
// ============================================

/**
 * Initialize predefined templates in database
 * تهيئة القوالب المحددة مسبقاً في قاعدة البيانات
 */
export async function initializeTemplates(): Promise<void> {
  if (!isDatabaseAvailable()) {
    console.log('Database not available, skipping template initialization');
    return;
  }

  for (const [code, tasks] of Object.entries(PREDEFINED_TEMPLATES)) {
    const templateData = getTemplateMetadata(code);
    
    // Check if template already exists
    const existing = await db.projectTemplate.findUnique({
      where: { code },
    });

    if (existing) {
      console.log(`Template ${code} already exists, skipping`);
      continue;
    }

    // Create template
    const template = await db.projectTemplate.create({
      data: {
        name: templateData.name,
        nameAr: templateData.nameAr,
        code,
        description: templateData.description,
        descriptionAr: templateData.descriptionAr,
        category: templateData.category,
        estimatedDays: tasks.reduce((sum, t) => sum + t.slaDays, 0),
        tasks: {
          create: tasks.map((task) => ({
            taskName: task.name,
            taskNameAr: task.nameAr,
            description: task.description,
            descriptionAr: task.descriptionAr,
            taskType: TaskType.GOVERNMENTAL,
            slaDays: task.slaDays,
            slaWarningDays: task.slaWarningDays || 1,
            estimatedMinutes: task.estimatedMinutes,
            order: task.order,
            dependencies: task.dependencies ? JSON.stringify(task.dependencies) : null,
            governmentEntity: task.governmentEntity,
            governmentEntityAr: task.governmentEntityAr,
            isMandatory: true,
            color: task.color,
          })),
        },
      },
    });

    console.log(`Created template: ${template.name} (${code})`);
  }
}

/**
 * Get template metadata by code
 */
function getTemplateMetadata(code: string): {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: string;
} {
  const metadata: Record<string, any> = {
    FEWA: {
      name: 'FEWA Electricity & Water Connection',
      nameAr: 'توصيل هيئة الكهرباء والماء',
      description: 'Standard workflow for FEWA utility connections',
      descriptionAr: 'سير العمل القياسي لتوصيل هيئة الكهرباء والماء',
      category: 'utility',
    },
    CIVIL_DEFENSE: {
      name: 'Civil Defense Approval',
      nameAr: 'موافقة الدفاع المدني',
      description: 'Fire safety and civil defense approval workflow',
      descriptionAr: 'سير عمل موافقة الدفاع المدني والسلامة',
      category: 'safety',
    },
    MUNICIPALITY: {
      name: 'Municipality Building Permit',
      nameAr: 'رخصة بناء البلدية',
      description: 'Building permit application through municipality',
      descriptionAr: 'طلب ترخيص بناء عبر البلدية',
      category: 'municipality',
    },
    TELECOM: {
      name: 'Telecom Connection',
      nameAr: 'توصيل الاتصالات',
      description: 'Internet and phone line installation workflow',
      descriptionAr: 'سير عمل تركيب خطوط الإنترنت والهاتف',
      category: 'communications',
    },
  };

  return metadata[code] || {
    name: code,
    nameAr: code,
    description: '',
    descriptionAr: '',
    category: 'general',
  };
}

/**
 * Create tasks from template for a project
 * إنشاء مهام من قالب لمشروع
 */
export async function createTasksFromTemplate(
  input: CreateProjectFromTemplateInput
): Promise<{ created: number; tasks: any[] }> {
  if (!isDatabaseAvailable()) {
    throw new Error('Database not available');
  }

  const { projectId, templateCode, customStartDate, assignedToId } = input;
  const startDate = customStartDate || new Date();

  // Get template
  const template = await db.projectTemplate.findUnique({
    where: { code: templateCode },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });

  if (!template) {
    throw new Error(`Template not found: ${templateCode}`);
  }

  // Verify project exists
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Create tasks
  const createdTasks: any[] = [];

  for (const templateTask of template.tasks) {
    const taskStartDate = new Date(startDate);
    // Add days based on order (simplified dependency handling)
    taskStartDate.setDate(taskStartDate.getDate() + (templateTask.order - 1) * 2);

    const taskEndDate = new Date(taskStartDate);
    taskEndDate.setDate(taskEndDate.getDate() + templateTask.slaDays);

    const task = await db.task.create({
      data: {
        projectId,
        title: templateTask.taskName,
        titleAr: templateTask.taskNameAr,
        description: templateTask.description,
        taskType: TaskType.GOVERNMENTAL,
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        startDate: taskStartDate,
        endDate: taskEndDate,
        estimatedMinutes: templateTask.estimatedMinutes,
        slaDays: templateTask.slaDays,
        slaWarningDays: templateTask.slaWarningDays,
        slaStartDate: taskStartDate,
        isMandatory: templateTask.isMandatory,
        workflowTemplate: templateCode,
        governmentEntity: templateTask.governmentEntity,
        assignedTo: assignedToId,
        order: templateTask.order,
        color: templateTask.color,
        dependencies: templateTask.dependencies as any,
      },
    });

    createdTasks.push(task);
  }

  return {
    created: createdTasks.length,
    tasks: createdTasks,
  };
}

/**
 * Get all available templates
 * الحصول على جميع القوالب المتاحة
 */
export async function getAvailableTemplates(): Promise<any[]> {
  if (!isDatabaseAvailable()) {
    return Object.keys(PREDEFINED_TEMPLATES).map((code) => ({
      code,
      ...getTemplateMetadata(code),
      isPredefined: true,
    }));
  }

  return db.projectTemplate.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get template details with tasks
 */
export async function getTemplateDetails(templateCode: string): Promise<any | null> {
  if (!isDatabaseAvailable()) return null;

  return db.projectTemplate.findUnique({
    where: { code: templateCode },
    include: {
      tasks: { orderBy: { order: 'asc' } },
    },
  });
}

export default {
  initializeTemplates,
  createTasksFromTemplate,
  getAvailableTemplates,
  getTemplateDetails,
  PREDEFINED_TEMPLATES,
};
