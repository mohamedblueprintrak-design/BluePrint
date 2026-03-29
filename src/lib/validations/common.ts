/**
 * Common Validation Schemas
 * مخططات التحقق الشائعة
 */

import { z } from 'zod'

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// UUID schema
export const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format')

// Email schema
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .transform(email => email.toLowerCase())

// Password schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Password schema (less strict for demo)
export const simplePasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters')

// Username schema
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

// Name schema
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')

// Phone schema
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-]+$/, 'Invalid phone number')
  .optional()
  .nullable()

// URL schema
export const urlSchema = z.string().url('Invalid URL').optional().nullable()

// Status enum schemas
export const projectStatusSchema = z.enum([
  'pending',
  'active',
  'on_hold',
  'completed',
  'cancelled',
])

export const taskStatusSchema = z.enum([
  'todo',
  'in_progress',
  'review',
  'done',
  'cancelled',
])

export const taskPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
])

export const invoiceStatusSchema = z.enum([
  'draft',
  'pending',
  'paid',
  'overdue',
  'cancelled',
])

export const contractStatusSchema = z.enum([
  'draft',
  'pending_signature',
  'active',
  'expired',
  'terminated',
  'completed',
])

export const userRoleSchema = z.enum([
  'admin',
  'manager',
  'project_manager',
  'engineer',
  'accountant',
  'hr',
  'viewer',
])

// Filter schemas for common entities
export const projectFilterSchema = paginationSchema.extend({
  status: projectStatusSchema.optional(),
  clientId: cuidSchema.optional(),
  managerId: cuidSchema.optional(),
  search: z.string().optional(),
})

export const taskFilterSchema = paginationSchema.extend({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedTo: cuidSchema.optional(),
  projectId: cuidSchema.optional(),
})

// Create/Update schemas
export const createProjectSchema = z.object({
  name: nameSchema,
  projectNumber: z.string().optional(),
  location: z.string().optional(),
  projectType: z.string().optional(),
  description: z.string().optional(),
  contractValue: z.coerce.number().min(0).optional(),
  contractDate: z.coerce.date().optional(),
  expectedStartDate: z.coerce.date().optional(),
  expectedEndDate: z.coerce.date().optional(),
  managerId: cuidSchema.optional(),
  clientId: cuidSchema.optional(),
  budget: z.coerce.number().min(0).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const createTaskSchema = z.object({
  title: nameSchema,
  description: z.string().optional(),
  projectId: cuidSchema.optional(),
  parentId: cuidSchema.optional(),
  assignedTo: cuidSchema.optional().nullable(),
  priority: taskPrioritySchema.default('medium'),
  status: taskStatusSchema.default('todo'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  progress: z.coerce.number().min(0).max(100).optional(),
  actualHours: z.coerce.number().min(0).optional(),
})

export const createClientSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().nullable(),
  phone: phoneSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
  paymentTerms: z.coerce.number().int().min(0).default(30),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

// Invoice schemas
export const createInvoiceItemSchema = z.object({
  description: nameSchema,
  quantity: z.coerce.number().min(0).default(1),
  unitPrice: z.coerce.number().min(0).default(0),
  unit: z.string().optional(),
})

export const createInvoiceSchema = z.object({
  clientId: cuidSchema.optional(),
  projectId: cuidSchema.optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(createInvoiceItemSchema).min(1, 'At least one item is required'),
})

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: simplePasswordSchema,
  fullName: nameSchema,
  organizationName: z.string().min(2).max(100).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Profile update schema
export const updateProfileSchema = z.object({
  fullName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  jobTitle: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  language: z.enum(['ar', 'en']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

// Organization schema
export const createOrganizationSchema = z.object({
  name: nameSchema,
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  website: urlSchema,
  phone: phoneSchema,
  email: emailSchema.optional().nullable(),
  address: z.string().optional(),
  currency: z.string().default('AED'),
  timezone: z.string().default('Asia/Dubai'),
  locale: z.enum(['ar', 'en']).default('ar'),
})

// Type exports
export type PaginationInput = z.infer<typeof paginationSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>
export type TaskFilterInput = z.infer<typeof taskFilterSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
