/**
 * API Validation Schemas using Zod
 * مخططات التحقق من صحة البيانات لواجهة برمجة التطبيقات
 * 
 * Provides consistent input validation for all API routes
 */

import { z } from 'zod';

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  username: z.string().optional(),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  rememberMe: z.boolean().optional(),
  twoFactorCode: z.string().length(6, 'رمز التحقق يجب أن يكون 6 أرقام').optional(),
}).refine(
  (data) => data.email || data.username,
  { message: 'البريد الإلكتروني أو اسم المستخدم مطلوب' }
);

export const signupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  username: z.string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(30, 'اسم المستخدم يجب أن يكون 30 حرف كحد أقصى')
    .regex(/^[a-zA-Z0-9_-]+$/, 'اسم المستخدم يحتوي فقط على أحرف، أرقام، _ أو -'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم يجب أن يكون 100 حرف كحد أقصى'),
  organizationName: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'كلمتا المرور غير متطابقتين' }
);

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
  newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'كلمتا المرور غير متطابقتين' }
);

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'اسم المشروع مطلوب').max(255, 'اسم المشروع طويل جداً'),
  location: z.string().optional(),
  projectType: z.string().optional(),
  clientId: z.string().cuid('معرف العميل غير صالح').optional(),
  contractValue: z.string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative('قيمة العقد يجب أن تكون رقم موجب'))
    .optional()
    .or(z.number().nonnegative().optional()),
  description: z.string().optional(),
  managerId: z.string().cuid('معرف مدير المشروع غير صالح').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  location: z.string().optional(),
  projectType: z.string().optional(),
  description: z.string().optional(),
  contractValue: z.number().nonnegative().optional(),
  status: z.enum(['pending', 'active', 'on_hold', 'completed', 'cancelled'], 'حالة المشروع غير صحيحة').optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  expectedStartDate: z.string().datetime().optional().or(z.date().optional()),
  expectedEndDate: z.string().datetime().optional().or(z.date().optional()),
  actualStartDate: z.string().datetime().optional().or(z.date().optional()),
  actualEndDate: z.string().datetime().optional().or(z.date().optional()),
  managerId: z.string().optional(),
  clientId: z.string().optional(),
  budget: z.number().nonnegative().optional(),
});

export const projectQuerySchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().positive().max(100)),
  status: z.enum(['pending', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================
// Client Schemas
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب').max(255),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  taxNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  clientType: z.enum(['company', 'individual', 'government'], 'نوع العميل غير صالح').default('company'),
  creditLimit: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  taxNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  clientType: z.enum(['company', 'individual', 'government']).optional(),
  creditLimit: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Task Schemas
// ============================================

export const createTaskSchema = z.object({
  title: z.string().min(1, 'عنوان المهمة مطلوب').max(500),
  description: z.string().optional(),
  projectId: z.string().cuid().optional(),
  assignedToId: z.string().cuid('معرف المستخدم المعين غير صالح').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], 'أولوية المهمة غير صحيحة').default('medium'),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  estimatedHours: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().nonnegative().optional(),
  assignedToId: z.string().optional(),
});

// ============================================
// Invoice Schemas
// ============================================

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'وصف البند مطلوب'),
  quantity: z.number().positive('الكمية يجب أن تكون رقم موجب').default(1),
  unitPrice: z.number().nonnegative('سعر الوحدة يجب أن يكون رقم غير سالب').default(0),
  unit: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  issueDate: z.string().datetime().optional().or(z.date().optional()),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  items: z.array(invoiceItemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
  taxRate: z.number().min(0).max(100).default(5),
  discountAmount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

// ============================================
// Generic Query & Pagination
// ============================================

export const paginationQuerySchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().positive().max(100)),
  search: z.string().max(200).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================
// Contract Schemas
// ============================================

export const createContractSchema = z.object({
  title: z.string().min(1, 'عنوان العقد مطلوب').max(500),
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  contractType: z.enum(['service', 'construction', 'consulting', 'maintenance']).default('service'),
  value: z.number().nonnegative().default(0),
  currency: z.string().default('AED'),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

export const updateContractSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  contractType: z.enum(['service', 'construction', 'consulting', 'maintenance']).optional(),
  status: z.enum(['draft', 'pending_signature', 'active', 'expired', 'terminated', 'completed']).optional(),
  value: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// Proposal Schemas
// ============================================

export const createProposalSchema = z.object({
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  title: z.string().min(1).max(500).optional(),
  issueDate: z.string().datetime().optional().or(z.date().optional()),
  validUntil: z.string().datetime().optional().or(z.date().optional()),
  items: z.array(invoiceItemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
  taxRate: z.number().min(0).max(100).default(5),
  discountAmount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

// ============================================
// Leave Request Schemas
// ============================================

export const createLeaveRequestSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'emergency', 'maternity', 'paternity', 'unpaid']).default('annual'),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  reason: z.string().optional(),
});

export const updateLeaveRequestSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  rejectionReason: z.string().optional(),
});

// ============================================
// Notification Settings Schema
// ============================================

export const notificationSettingsSchema = z.object({
  emailInvoices: z.boolean().default(false),
  emailTasks: z.boolean().default(false),
  emailLeaves: z.boolean().default(false),
  emailProjects: z.boolean().default(false),
  emailPayments: z.boolean().default(false),
  pushEnabled: z.boolean().default(false),
  pushTasks: z.boolean().default(false),
  pushLeaves: z.boolean().default(false),
  pushProjects: z.boolean().default(false),
  digestEmail: z.boolean().default(false),
});

// ============================================
// Helper: Validate and return parsed data or error
// ============================================

export async function validateBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<{
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return { success: false, errors: result.error };
    }
    return { success: true, data: result.data };
  } catch {
    return { success: false, errors: undefined };
  }
}

export async function validateQuery<T extends Record<string, unknown>>(request: Request, schema: z.ZodSchema<T>): Promise<{
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => { params[key] = value });
  const result = schema.safeParse(params);
  if (!result.success) {
    return { success: false, errors: result.error };
  }
  return { success: true, data: result.data };
}
