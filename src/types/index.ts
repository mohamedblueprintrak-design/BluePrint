// BluePrint - Type Definitions

// ============================================
// Auth & User Types
// ============================================

export interface User {
  id: string;
  organizationId?: string;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  language: 'ar' | 'en';
  theme: 'dark' | 'light' | 'system';
  phone?: string;
  jobTitle?: string;
  department?: string;
  hireDate?: Date;
  salary?: number;
  leaveBalance: number;
  nationality?: string;
  timezone: string;
  lastLoginAt?: Date;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'engineer' | 'accountant' | 'hr' | 'project_manager' | 'viewer';

export interface Session {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions?: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

// ============================================
// Organization Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  currency: string;
  timezone: string;
  locale: 'ar' | 'en';
  isActive: boolean;
  planId?: string;
  trialEndsAt?: Date;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface PlanFeature {
  key: string;
  name: string;
  enabled: boolean;
  limit?: number;
}

export interface PlanLimits {
  projects: number;
  users: number;
  storage: number; // in MB
  invoices: number;
  aiCalls: number;
}

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  projectNumber?: string;
  location?: string;
  projectType?: string;
  clientId?: string;
  client?: Client;
  contractValue?: number;
  contractDate?: Date;
  expectedStartDate?: Date;
  expectedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  projectManagerId?: string;
  status: ProjectStatus;
  progressPercentage: number;
  description?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  users?: ProjectUser[];
  tasks?: Task[];
  milestones?: ProjectMilestone[];
  files?: UploadedFile[];
  siteReports?: SiteReport[];
  defects?: Defect[];
  invoices?: Invoice[];
  budgets?: Budget[];
  expenses?: Expense[];
}

export type ProjectStatus = 'pending' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface ProjectUser {
  id: string;
  projectId: string;
  userId: string;
  permission: 'read' | 'write' | 'admin';
  user?: User;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  plannedDate?: Date;
  actualDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  createdAt: Date;
}

// ============================================
// Client Types
// ============================================

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  contactPerson?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  clientType: 'company' | 'individual' | 'government';
  creditLimit: number;
  totalInvoiced: number;
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
}

// ============================================
// Invoice Types
// ============================================

export interface Invoice {
  id: string;
  organizationId?: string;
  invoiceNumber: string;
  projectId?: string;
  project?: Project;
  clientId?: string;
  client?: Client;
  issueDate?: Date;
  dueDate?: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  payments?: Payment[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
}

// ============================================
// Task Types
// ============================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  project?: Project;
  assignedToId?: string;
  assignee?: User;
  createdById?: string;
  creator?: User;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  progress: number;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  subtasks?: SubTask[];
  comments?: Comment[];
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: Date;
}

// ============================================
// HR Types
// ============================================

export interface Attendance {
  id: string;
  userId: string;
  user?: User;
  date: Date;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  workHours: number;
  overtimeHours: number;
  notes?: string;
  location?: string;
  ipAddress?: string;
  createdAt: Date;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday';

export interface LeaveRequest {
  id: string;
  userId: string;
  user?: User;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysCount: number;
  reason?: string;
  status: LeaveStatus;
  approvedById?: string;
  approver?: User;
  approvedAt?: Date;
  rejectionReason?: string;
  attachment?: string;
  createdAt: Date;
}

export type LeaveType = 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// ============================================
// Supplier & Material Types
// ============================================

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  supplierType: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  contactPerson?: string;
  rating: number;
  creditLimit: number;
  isApproved: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
}

export interface Material {
  id: string;
  organizationId: string;
  materialCode?: string;
  name: string;
  category?: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location?: string;
  supplier?: string;
  isActive: boolean;
  createdAt: Date;
  transactions?: MaterialTransaction[];
}

export interface MaterialTransaction {
  id: string;
  materialId: string;
  material?: Material;
  projectId?: string;
  transactionType: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  notes?: string;
  reference?: string;
  createdById?: string;
  createdAt: Date;
}

// ============================================
// Contract Types
// ============================================

export interface Contract {
  id: string;
  organizationId?: string;
  contractNumber: string;
  title: string;
  projectId?: string;
  clientId?: string;
  client?: Client;
  supplierId?: string;
  contractType: ContractType;
  contractValue?: number;
  startDate?: Date;
  endDate?: Date;
  retentionPercentage: number;
  advancePayment: number;
  status: ContractStatus;
  notes?: string;
  terms?: string;
  attachments?: string[];
  createdAt: Date;
  variations?: ContractVariation[];
}

export type ContractType = 'lump_sum' | 'unit_price' | 'cost_plus' | 'time_materials';
export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated' | 'cancelled';

export interface ContractVariation {
  id: string;
  contractId: string;
  variationNumber: string;
  description?: string;
  value: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedDate?: Date;
  notes?: string;
  createdAt: Date;
}

// ============================================
// Document Types
// ============================================

export interface Document {
  id: string;
  filename: string;
  originalName?: string;
  filePath: string;
  fileType?: string;
  mimeType?: string;
  fileSize?: number;
  category: string;
  relatedTo?: string;
  relatedId?: string;
  description?: string;
  tags?: string[];
  version: number;
  uploadedById?: string;
  uploader?: User;
  createdAt: Date;
}

export interface UploadedFile {
  id: string;
  projectId: string;
  filename: string;
  originalName?: string;
  fileType?: string;
  mimeType?: string;
  filePath: string;
  fileSize?: number;
  analyzed: boolean;
  analysisResult?: string;
  uploadedById?: string;
  tags?: string[];
  createdAt: Date;
}

// ============================================
// Site Report Types
// ============================================

export interface SiteReport {
  id: string;
  projectId: string;
  project?: Project;
  reportDate: Date;
  reportNumber?: string;
  weather?: string;
  temperature?: number;
  workersCount?: number;
  workDescription?: string;
  workArea?: string;
  workProgress: number;
  issues?: string;
  safetyIssues?: string;
  equipmentUsed?: string;
  materialsReceived?: string;
  nextSteps?: string;
  nextDayPlan?: string;
  preparedById?: string;
  approvedById?: string;
  photos?: string[];
  attachments?: string[];
  summary?: string;
  status: 'draft' | 'submitted' | 'approved';
  createdAt: Date;
}

export interface SiteVisit {
  id: string;
  projectId: string;
  project?: Project;
  visitDate: Date;
  visitType: 'inspection' | 'meeting' | 'survey' | 'handover';
  visitors?: string;
  purpose?: string;
  findings?: string;
  recommendations?: string;
  photos?: string[];
  createdById?: string;
  createdAt: Date;
}

export interface Defect {
  id: string;
  projectId: string;
  project?: Project;
  title?: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'Open' | 'In_Progress' | 'Resolved' | 'Closed';
  location?: string;
  imageId?: string;
  assignedTo?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string;
  notificationType: 'system' | 'task' | 'project' | 'invoice' | 'approval' | 'mention';
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  readAt?: Date;
  actionUrl?: string;
  createdAt: Date;
}

// ============================================
// Activity & Audit Types
// ============================================

export interface Activity {
  id: string;
  userId?: string;
  user?: User;
  projectId?: string;
  project?: Project;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================
// Proposal Types
// ============================================

export interface Proposal {
  id: string;
  organizationId?: string;
  proposalNumber: string;
  projectId?: string;
  project?: Project;
  clientId?: string;
  client?: Client;
  title?: string;
  issueDate?: Date;
  validUntil?: Date;
  items: ProposalItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: ProposalStatus;
  notes?: string;
  terms?: string;
  createdAt: Date;
}

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}

// ============================================
// Budget & Expense Types
// ============================================

export interface Budget {
  id: string;
  projectId: string;
  project?: Project;
  category: string;
  description?: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  createdAt: Date;
}

export interface Expense {
  id: string;
  projectId?: string;
  project?: Project;
  category: string;
  description?: string;
  amount: number;
  expenseDate: Date;
  paidTo?: string;
  receiptNumber?: string;
  receiptImage?: string;
  notes?: string;
  createdById?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedById?: string;
  approvedAt?: Date;
  createdAt: Date;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface ChatHistory {
  id: string;
  projectId?: string;
  userId?: string;
  role: string;
  message: string;
  modelUsed?: string;
  tokensUsed: number;
  createdAt: Date;
}

// ============================================
// Comment Types
// ============================================

export interface Comment {
  id: string;
  content: string;
  entityType: 'project' | 'task' | 'document';
  entityId: string;
  userId: string;
  user?: User;
  parentId?: string;
  parent?: Comment;
  replies?: Comment[];
  mentions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
  clients: {
    total: number;
    active: number;
  };
  financial: {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    overdueAmount: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  defects: {
    open: number;
    resolved: number;
    critical: number;
  };
  employees: {
    total: number;
    presentToday: number;
    onLeave: number;
  };
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Form Types
// ============================================

export interface LoginForm {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  organizationName?: string;
}

export interface ProjectForm {
  name: string;
  location?: string;
  projectType?: string;
  clientId?: string;
  contractValue?: number;
  contractDate?: string;
  expectedStartDate?: string;
  expectedEndDate?: string;
  description?: string;
  projectManagerId?: string;
}

export interface ClientForm {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxNumber?: string;
  website?: string;
  clientType: 'company' | 'individual' | 'government';
  creditLimit?: number;
  notes?: string;
}

export interface InvoiceForm {
  clientId?: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  terms?: string;
}

export interface TaskForm {
  title: string;
  description?: string;
  projectId?: string;
  assignedToId?: string;
  priority: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

// ============================================
// Filter & Sort Types
// ============================================

export interface FilterOptions {
  status?: string;
  priority?: string;
  clientId?: string;
  projectId?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}
