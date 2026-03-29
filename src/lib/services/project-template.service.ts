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

export interface WorkflowPhaseTemplateData {
  phaseType: string;
  phaseTypeAr?: string;
  phaseCategory: string;
  description?: string;
  descriptionAr?: string;
  slaDays: number;
  slaWarningDays?: number;
  order: number;
  dependsOnOrder?: number;
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
            taskNameAr: task.nameAr ?? null,
            description: task.description ?? null,
            descriptionAr: task.descriptionAr ?? null,
            taskType: TaskType.GOVERNMENTAL,
            slaDays: task.slaDays,
            slaWarningDays: task.slaWarningDays || 1,
            estimatedMinutes: task.estimatedMinutes,
            order: task.order,
            dependencies: task.dependencies ? JSON.stringify(task.dependencies) : null,
            governmentEntity: task.governmentEntity ?? null,
            governmentEntityAr: task.governmentEntityAr ?? null,
            isMandatory: true,
            color: task.color ?? null,
          })) as any,
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

// ============================================
// Architectural & Contract Workflow Phase Templates
// قوالب مراحل سير العمل المعمارية والعقود
// ============================================

/**
 * Create Architectural Workflow Phase Template
 * Creates phases for the full architectural design workflow with SLA tracking.
 *
 * Phases:
 * 1. Sketch (مخطط أولي) - 4 days
 * 2. Client Approval (موافقة العميل) - 3 days
 * 3. Modification (تعديلات) - 4 days
 * 4. Preliminary Drawings (مخططات مبدئية) - 6 days
 * 5. 3D Max (تصميم ثلاثي الأبعاد) - 5 days
 * 6. Final Drawings (مخططات نهائية) - 7 days
 */
export function createArchitecturalTemplate(): WorkflowPhaseTemplateData[] {
  return [
    {
      phaseType: 'ARCHITECTURAL_SKETCH',
      phaseTypeAr: 'مخطط أولي',
      phaseCategory: 'ARCHITECTURAL',
      description: 'Initial architectural sketch and concept design',
      descriptionAr: 'المخطط المعماري الأولي والتصميم المبدئي',
      slaDays: 4,
      slaWarningDays: 3,
      order: 1,
      color: '#3B82F6',
    },
    {
      phaseType: 'CLIENT_APPROVAL',
      phaseTypeAr: 'موافقة العميل',
      phaseCategory: 'ARCHITECTURAL',
      description: 'Client review and approval of the architectural sketch',
      descriptionAr: 'مراجعة العميل والموافقة على المخطط المعماري',
      slaDays: 3,
      slaWarningDays: 2,
      order: 2,
      dependsOnOrder: 1,
      color: '#F59E0B',
    },
    {
      phaseType: 'MODIFICATION',
      phaseTypeAr: 'تعديلات',
      phaseCategory: 'ARCHITECTURAL',
      description: 'Modifications based on client feedback',
      descriptionAr: 'التعديلات بناءً على ملاحظات العميل',
      slaDays: 4,
      slaWarningDays: 3,
      order: 3,
      dependsOnOrder: 2,
      color: '#EF4444',
    },
    {
      phaseType: 'PRELIMINARY_DRAWINGS',
      phaseTypeAr: 'مخططات مبدئية',
      phaseCategory: 'ARCHITECTURAL',
      description: 'Preliminary architectural drawings and plans',
      descriptionAr: 'المخططات والرسومات المعمارية المبدئية',
      slaDays: 6,
      slaWarningDays: 4,
      order: 4,
      dependsOnOrder: 3,
      color: '#8B5CF6',
    },
    {
      phaseType: '3D_MAX',
      phaseTypeAr: 'تصميم ثلاثي الأبعاد',
      phaseCategory: 'ARCHITECTURAL',
      description: '3D Max visualization and rendering',
      descriptionAr: 'تصميم وتصيير ثلاثي الأبعاد',
      slaDays: 5,
      slaWarningDays: 4,
      order: 5,
      dependsOnOrder: 4,
      color: '#06B6D4',
    },
    {
      phaseType: 'FINAL_DRAWINGS',
      phaseTypeAr: 'مخططات نهائية',
      phaseCategory: 'ARCHITECTURAL',
      description: 'Final architectural drawings and construction documents',
      descriptionAr: 'المخططات المعمارية النهائية ومستندات البناء',
      slaDays: 7,
      slaWarningDays: 5,
      order: 6,
      dependsOnOrder: 5,
      color: '#10B981',
    },
  ];
}

/**
 * Create Contract Workflow Phase Template
 * Creates phases for the contract review and signing workflow.
 *
 * Phases:
 * 1. Contract Review (مراجعة العقد) - 2 days
 * 2. Contract Signing (توقيع العقد) - 1 day
 */
export function createContractTemplate(): WorkflowPhaseTemplateData[] {
  return [
    {
      phaseType: 'CONTRACT_REVIEW',
      phaseTypeAr: 'مراجعة العقد',
      phaseCategory: 'CONTRACTING',
      description: 'Review contract terms, conditions, and legal clauses',
      descriptionAr: 'مراجعة شروط وأحكام العقد والبنود القانونية',
      slaDays: 2,
      slaWarningDays: 1,
      order: 1,
      color: '#F59E0B',
    },
    {
      phaseType: 'CONTRACT_SIGNING',
      phaseTypeAr: 'توقيع العقد',
      phaseCategory: 'CONTRACTING',
      description: 'Contract signing by all parties',
      descriptionAr: 'توقيع العقد من جميع الأطراف',
      slaDays: 1,
      slaWarningDays: 1,
      order: 2,
      dependsOnOrder: 1,
      color: '#10B981',
    },
  ];
}

/**
 * Create Structural Workflow Phase Template
 * Creates phases for the structural engineering design workflow.
 *
 * Phases:
 * 1. Soil Report (تقرير التربة) - 3 days
 * 2. Foundation Design (تصميم الأساسات) - 5 days
 * 3. Structural Calculations (الحسابات الإنشائية) - 7 days
 * 4. Structural Drawings (الرسومات الإنشائية) - 6 days
 */
export function createStructuralTemplate(): WorkflowPhaseTemplateData[] {
  return [
    {
      phaseType: 'SOIL_REPORT',
      phaseTypeAr: 'تقرير التربة',
      phaseCategory: 'STRUCTURAL',
      description: 'Soil investigation and geotechnical report for foundation design',
      descriptionAr: 'تقرير التحقيق الجيوتقني وتربة الموقع لتصميم الأساسات',
      slaDays: 3,
      slaWarningDays: 2,
      order: 1,
      color: '#92400E',
    },
    {
      phaseType: 'FOUNDATION_DESIGN',
      phaseTypeAr: 'تصميم الأساسات',
      phaseCategory: 'STRUCTURAL',
      description: 'Foundation design based on soil report and structural requirements',
      descriptionAr: 'تصميم الأساسات بناءً على تقرير التربة والمتطلبات الإنشائية',
      slaDays: 5,
      slaWarningDays: 4,
      order: 2,
      dependsOnOrder: 1,
      color: '#B45309',
    },
    {
      phaseType: 'STRUCTURAL_CALCULATIONS',
      phaseTypeAr: 'الحسابات الإنشائية',
      phaseCategory: 'STRUCTURAL',
      description: 'Full structural analysis and calculations including load, seismic, and wind analysis',
      descriptionAr: 'التحليل والحسابات الإنشائية الكاملة بما في ذلك الأحمال والزلازل والرياح',
      slaDays: 7,
      slaWarningDays: 5,
      order: 3,
      dependsOnOrder: 2,
      color: '#D97706',
    },
    {
      phaseType: 'STRUCTURAL_DRAWINGS',
      phaseTypeAr: 'الرسومات الإنشائية',
      phaseCategory: 'STRUCTURAL',
      description: 'Final structural drawings including reinforcement details and connection designs',
      descriptionAr: 'الرسومات الإنشائية النهائية بما في ذلك تفاصيل التسليح وتصاميم الوصلات',
      slaDays: 6,
      slaWarningDays: 4,
      order: 4,
      dependsOnOrder: 3,
      color: '#F59E0B',
    },
  ];
}

/**
 * Create MEP Workflow Phase Template
 * Creates phases for the Mechanical, Electrical, and Plumbing design workflow.
 *
 * Phases:
 * 1. Electrical Design (تصميم كهربائي) - 5 days
 * 2. Plumbing Design (تصميم سباكة) - 4 days
 * 3. HVAC Design (تصميم تكييف) - 5 days
 * 4. MEP Coordination (تنسيق MEP) - 3 days
 * 5. MEP Shop Drawings (مخططات تنفيذية MEP) - 7 days
 */
export function createMEPTemplate(): WorkflowPhaseTemplateData[] {
  return [
    {
      phaseType: 'ELECTRICAL_DESIGN',
      phaseTypeAr: 'تصميم كهربائي',
      phaseCategory: 'MEP',
      description: 'Electrical power distribution, lighting, and low-current systems design',
      descriptionAr: 'تصميم توزيع الطاقة الكهربائية والإضاءة والأنظمة منخفضة التيار',
      slaDays: 5,
      slaWarningDays: 4,
      order: 1,
      color: '#DC2626',
    },
    {
      phaseType: 'PLUMBING_DESIGN',
      phaseTypeAr: 'تصميم سباكة',
      phaseCategory: 'MEP',
      description: 'Water supply, drainage, and fire-fighting plumbing systems design',
      descriptionAr: 'تصميم أنظمة إمداد المياه والصرف ومكافحة الحرائق',
      slaDays: 4,
      slaWarningDays: 3,
      order: 2,
      color: '#2563EB',
    },
    {
      phaseType: 'HVAC_DESIGN',
      phaseTypeAr: 'تصميم تكييف',
      phaseCategory: 'MEP',
      description: 'Heating, ventilation, and air conditioning system design and load calculations',
      descriptionAr: 'تصميم نظام التدفئة والتهوية وتكييف الهواء وحسابات الأحمال',
      slaDays: 5,
      slaWarningDays: 4,
      order: 3,
      color: '#7C3AED',
    },
    {
      phaseType: 'MEP_COORDINATION',
      phaseTypeAr: 'تنسيق MEP',
      phaseCategory: 'MEP',
      description: 'Clash detection and coordination between all MEP disciplines',
      descriptionAr: 'كشف التعارضات والتنسيق بين جميع تخصصات MEP',
      slaDays: 3,
      slaWarningDays: 2,
      order: 4,
      dependsOnOrder: 1,
      color: '#0891B2',
    },
    {
      phaseType: 'MEP_SHOP_DRAWINGS',
      phaseTypeAr: 'مخططات تنفيذية MEP',
      phaseCategory: 'MEP',
      description: 'Final MEP shop drawings for contractor execution',
      descriptionAr: 'المخططات التنفيذية النهائية لتنفيذ المقاول',
      slaDays: 7,
      slaWarningDays: 5,
      order: 5,
      dependsOnOrder: 4,
      color: '#059669',
    },
  ];
}

/**
 * Create Government Approvals Workflow Phase Template
 * Creates phases for the complete government approval workflow in UAE/Gulf region.
 *
 * Phases:
 * 1. Municipality Submission (تقديم البلدية) - 3 days
 * 2. Municipality Review (مراجعة البلدية) - 21 days
 * 3. Civil Defense (الدفاع المدني) - 14 days
 * 4. FEWA/DEWA (هيئة الكهرباء والماء) - 14 days
 * 5. Final Approval (الموافقة النهائية) - 3 days
 */
export function createGovernmentTemplate(): WorkflowPhaseTemplateData[] {
  return [
    {
      phaseType: 'MUNICIPALITY_SUBMISSION',
      phaseTypeAr: 'تقديم البلدية',
      phaseCategory: 'GOVERNMENT',
      description: 'Prepare and submit all required documents to the municipality for building permit',
      descriptionAr: 'إعداد وتقديم جميع المستندات المطلوبة للبلدية للحصول على رخصة البناء',
      slaDays: 3,
      slaWarningDays: 2,
      order: 1,
      color: '#7C3AED',
    },
    {
      phaseType: 'MUNICIPALITY_REVIEW',
      phaseTypeAr: 'مراجعة البلدية',
      phaseCategory: 'GOVERNMENT',
      description: 'Municipality technical review and committee approval process',
      descriptionAr: 'المراجعة الفنية للبلدية وعملية موافقة اللجنة',
      slaDays: 21,
      slaWarningDays: 5,
      order: 2,
      dependsOnOrder: 1,
      color: '#6D28D9',
    },
    {
      phaseType: 'CIVIL_DEFENSE_APPROVAL',
      phaseTypeAr: 'الدفاع المدني',
      phaseCategory: 'GOVERNMENT',
      description: 'Submit fire safety plans to Civil Defense and obtain approval certificate',
      descriptionAr: 'تقديم خطط السلامة للدفاع المدني والحصول على شهادة الموافقة',
      slaDays: 14,
      slaWarningDays: 5,
      order: 3,
      dependsOnOrder: 2,
      color: '#DC2626',
    },
    {
      phaseType: 'FEWA_DEWA_APPROVAL',
      phaseTypeAr: 'هيئة الكهرباء والماء',
      phaseCategory: 'GOVERNMENT',
      description: 'Submit electrical and water connection plans to FEWA/DEWA for approval',
      descriptionAr: 'تقديم مخططات التوصيل الكهربائي والمائي لهيئة الكهرباء والماء للموافقة',
      slaDays: 14,
      slaWarningDays: 5,
      order: 4,
      dependsOnOrder: 2,
      color: '#2563EB',
    },
    {
      phaseType: 'FINAL_GOVERNMENT_APPROVAL',
      phaseTypeAr: 'الموافقة النهائية',
      phaseCategory: 'GOVERNMENT',
      description: 'Obtain final building permit after all government approvals are secured',
      descriptionAr: 'الحصول على رخصة البناء النهائية بعد استيفاء جميع الموافقات الحكومية',
      slaDays: 3,
      slaWarningDays: 2,
      order: 5,
      dependsOnOrder: 3,
      color: '#10B981',
    },
  ];
}

export default {
  initializeTemplates,
  createTasksFromTemplate,
  getAvailableTemplates,
  getTemplateDetails,
  PREDEFINED_TEMPLATES,
  createArchitecturalTemplate,
  createContractTemplate,
  createStructuralTemplate,
  createMEPTemplate,
  createGovernmentTemplate,
};
