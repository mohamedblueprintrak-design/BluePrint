/**
 * API Hooks Barrel Export
 *
 * Re-exports every hook and type from the domain-specific modules.
 * This file is the single source of truth for all API hooks.
 */

// Common types & helpers
export type {
  CreateDocumentData,
  UploadResult,
  ExportType,
  ReportType,
  ExportParams,
  VoucherFilters,
  CreateVoucherData,
  Budget,
  Defect,
  ProfileUpdate,
  PasswordChange,
  AdminUser,
  CreateUserData,
  UpdateUserData,
  PurchaseOrder,
  PurchaseOrderItem,
  KnowledgeArticle,
} from './common';

// CRUD factory
export { createCrudHooks } from './create-crud-hooks';

// Dashboard
export { useDashboard } from './dashboard';

// Projects
export { useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject } from './projects';

// Clients
export { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from './clients';

// Invoices
export { useInvoices, useInvoice, useCreateInvoice, useUpdateInvoiceStatus } from './invoices';

// Tasks
export { useTasks, useTask, useCreateTask, useUpdateTask, useDeleteTask } from './tasks';

// Suppliers
export { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from './suppliers';

// Materials
export { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from './materials';

// Contracts
export { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from './contracts';

// Proposals
export { useProposals, useCreateProposal, useUpdateProposal, useDeleteProposal } from './proposals';

// Documents
export {
  useDocuments,
  useCreateDocument,
  useDeleteDocument,
  useUploadFile,
  useUploadMultipleFiles,
} from './documents';

// Site Reports
export { useSiteReports, useCreateSiteReport } from './site-reports';

// Leave Requests
export { useLeaveRequests, useCreateLeaveRequest, useApproveLeaveRequest } from './leave-requests';

// Notifications
export {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from './notifications';

// Attendance
export { useAttendances } from './attendance';

// Expenses
export { useExpenses, useCreateExpense } from './expenses';

// Budgets
export { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from './budgets';

// Defects
export { useDefects, useCreateDefect, useUpdateDefect, useDeleteDefect } from './defects';

// Profile
export {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
  useDeleteAvatar,
} from './profile';

// Vouchers
export { useVouchers, useVoucher, useCreateVoucher, useDeleteVoucher } from './vouchers';

// Users (Admin)
export { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from './users';

// BOQ
export {
  useBOQItems,
  useCreateBOQItem,
  useUpdateBOQItem,
  useDeleteBOQItem,
} from './boq';

// AI Chat
export { useAIChat } from './ai-chat';

// Reports
export { useExportReport } from './reports';

// Purchase Orders
export {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
} from './purchase-orders';

// Meetings
export { useMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } from './meetings';
export type { Meeting } from './meetings';

// Knowledge Base
export {
  useKnowledgeArticles,
  useKnowledgeArticle,
  useCreateKnowledgeArticle,
  useUpdateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  useMarkArticleHelpful,
} from './knowledge';

// Municipality Correspondence
export {
  useCorrespondence,
  useCreateCorrespondence,
  useUpdateCorrespondence,
  useDeleteCorrespondence,
} from './correspondence';
export type {
  CorrespondenceRecord,
  CorrespondenceParams,
  CorrespondenceType,
  CorrespondenceStatus,
  CreateCorrespondenceData,
  UpdateCorrespondenceData,
} from './correspondence';
