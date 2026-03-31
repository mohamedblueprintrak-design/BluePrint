/**
 * Common types and interfaces shared across API hook modules
 */

/** Data required to create a document record */
export interface CreateDocumentData {
  filename: string;
  originalName: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description?: string;
  tags?: string[];
}

/** Result of a file upload operation */
export interface UploadResult {
  url: string;
  name: string;
  filename: string;
  type: string;
  category: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

/** Export format types */
export type ExportType = 'pdf' | 'excel';

/** Report types available for export */
export type ReportType = 'financial' | 'projects' | 'tasks' | 'clients' | 'invoices';

/** Parameters for report export */
export interface ExportParams {
  type: ExportType;
  report: ReportType;
  startDate?: string;
  endDate?: string;
  language?: 'ar' | 'en';
}

/** Voucher filter options */
export interface VoucherFilters {
  voucherType?: 'receipt' | 'payment';
  status?: string;
}

/** Data required to create a voucher */
export interface CreateVoucherData {
  voucherType: 'receipt' | 'payment';
  amount: number;
  currency?: string;
  exchangeRate?: number;
  date?: string;
  projectId?: string;
  invoiceId?: string;
  clientId?: string;
  supplierId?: string;
  paymentMethod: string;
  referenceNumber?: string;
  checkNumber?: string;
  checkDate?: string;
  bankName?: string;
  description?: string;
  notes?: string;
}

/** Budget entity (local definition, mirrors @/types Budget) */
export interface Budget {
  id: string;
  projectId: string;
  projectName?: string;
  category: string;
  description?: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  createdAt: Date | string;
}

/** Defect entity (local definition, mirrors @/types Defect) */
export interface Defect {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'Open' | 'In_Progress' | 'Resolved' | 'Closed';
  location?: string;
  imageId?: string;
  assignedTo?: string;
  resolvedAt?: Date | string;
  resolutionNotes?: string;
  createdAt: Date | string;
}

/** Profile update data */
export interface ProfileUpdate {
  fullName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  nationality?: string;
  language?: 'ar' | 'en';
  theme?: 'light' | 'dark';
  notifications?: {
    email: boolean;
    push: boolean;
  };
}

/** Password change data */
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Admin user entity */
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/** Data for creating a new user (admin) */
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: string;
}

/** Data for updating a user (admin) */
export interface UpdateUserData {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

/** Purchase Order entity */
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId?: string;
  supplierName?: string;
  projectId?: string;
  projectName?: string;
  orderDate?: Date | string;
  expectedDate?: Date | string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  status?: string;
  notes?: string;
  terms?: string;
  items?: PurchaseOrderItem[];
  createdAt?: Date | string;
}

/** Purchase Order Line Item */
export interface PurchaseOrderItem {
  id?: string;
  purchaseOrderId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total?: number;
  sortOrder?: number;
}

/** Knowledge Article entity */
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category?: 'guide' | 'faq' | 'policy' | 'template';
  tags?: string[];
  authorId?: string;
  isPublished?: boolean;
  viewCount?: number;
  helpfulCount?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}
