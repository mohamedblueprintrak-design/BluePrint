'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { 
  ApiResponse, Project, Client, Invoice, Task, Supplier, Material, 
  Contract, Proposal, SiteReport, Document, LeaveRequest, Notification,
  DashboardStats, FilterOptions, Voucher, BOQItem, User
} from '@/types';

// API helper function
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  action: string,
  data?: any,
  token?: string | null
): Promise<ApiResponse<T>> {
  const url = method === 'GET' 
    ? `/api?action=${action}${data ? '&' + new URLSearchParams(data).toString() : ''}`
    : `/api?action=${action}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

// ============================================
// Dashboard Hook
// ============================================

export function useDashboard() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<DashboardStats>('GET', 'dashboard', {}, token),
    enabled: !!token
  });
}

// ============================================
// Projects Hooks
// ============================================

export function useProjects(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => apiRequest<Project[]>('GET', 'projects', filters, token),
    enabled: !!token
  });
}

export function useProject(id: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => apiRequest<Project>('GET', 'project', { id }, token),
    enabled: !!token && !!id
  });
}

export function useCreateProject() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Project>) => 
      apiRequest<Project>('POST', 'project', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

export function useUpdateProject() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Project>) => 
      apiRequest<Project>('PUT', 'project', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    }
  });
}

export function useDeleteProject() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'project', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

// ============================================
// Clients Hooks
// ============================================

export function useClients(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => apiRequest<Client[]>('GET', 'clients', filters, token),
    enabled: !!token
  });
}

export function useClient(id: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => apiRequest<Client>('GET', 'client', { id }, token),
    enabled: !!token && !!id
  });
}

export function useCreateClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Client>) => 
      apiRequest<Client>('POST', 'client', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
}

export function useUpdateClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Client>) => 
      apiRequest<Client>('PUT', 'client', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    }
  });
}

export function useDeleteClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'client', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
}

// ============================================
// Invoices Hooks
// ============================================

export function useInvoices(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => apiRequest<Invoice[]>('GET', 'invoices', filters, token),
    enabled: !!token
  });
}

export function useInvoice(id: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => apiRequest<Invoice>('GET', 'invoice', { id }, token),
    enabled: !!token && !!id
  });
}

export function useCreateInvoice() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Invoice>) => 
      apiRequest<Invoice>('POST', 'invoice', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useUpdateInvoiceStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; status: string }) => 
      apiRequest('PUT', 'invoice-status', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
}

// ============================================
// Tasks Hooks
// ============================================

export function useTasks(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => apiRequest<Task[]>('GET', 'tasks', filters, token),
    enabled: !!token
  });
}

export function useTask(id: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => apiRequest<Task>('GET', 'task', { id }, token),
    enabled: !!token && !!id
  });
}

export function useCreateTask() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Task>) => 
      apiRequest<Task>('POST', 'task', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useUpdateTask() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Task>) => 
      apiRequest<Task>('PUT', 'task', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useDeleteTask() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'task', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

// ============================================
// Suppliers Hooks
// ============================================

export function useSuppliers(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => apiRequest<Supplier[]>('GET', 'suppliers', filters, token),
    enabled: !!token
  });
}

export function useCreateSupplier() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => 
      apiRequest<Supplier>('POST', 'supplier', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

// ============================================
// Materials Hooks
// ============================================

export function useMaterials(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['materials', filters],
    queryFn: () => apiRequest<Material[]>('GET', 'materials', filters, token),
    enabled: !!token
  });
}

export function useCreateMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Material>) => 
      apiRequest<Material>('POST', 'material', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  });
}

// ============================================
// Contracts Hooks
// ============================================

export function useContracts(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => apiRequest<Contract[]>('GET', 'contracts', filters, token),
    enabled: !!token
  });
}

export function useCreateContract() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Contract>) => 
      apiRequest<Contract>('POST', 'contract', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    }
  });
}

// ============================================
// Proposals Hooks
// ============================================

export function useProposals(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: () => apiRequest<Proposal[]>('GET', 'proposals', filters, token),
    enabled: !!token
  });
}

export function useCreateProposal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Proposal>) => 
      apiRequest<Proposal>('POST', 'proposal', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    }
  });
}

// ============================================
// Site Reports Hooks
// ============================================

export function useSiteReports(projectId?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['site-reports', projectId],
    queryFn: () => apiRequest<SiteReport[]>('GET', 'site-reports', { projectId }, token),
    enabled: !!token
  });
}

export function useCreateSiteReport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<SiteReport>) => 
      apiRequest<SiteReport>('POST', 'site-report', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-reports'] });
    }
  });
}

// ============================================
// Documents Hooks
// ============================================

export function useDocuments(filters?: FilterOptions) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => apiRequest<Document[]>('GET', 'documents', filters, token),
    enabled: !!token
  });
}

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

export function useCreateDocument() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDocumentData) => 
      apiRequest<Document>('POST', 'document', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
}

export function useDeleteDocument() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'document', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
}

// ============================================
// Leave Requests Hooks
// ============================================

export function useLeaveRequests(status?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['leave-requests', status],
    queryFn: () => apiRequest<LeaveRequest[]>('GET', 'leave-requests', { status }, token),
    enabled: !!token
  });
}

export function useCreateLeaveRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<LeaveRequest>) => 
      apiRequest<LeaveRequest>('POST', 'leave-request', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    }
  });
}

export function useApproveLeaveRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; approve: boolean; rejectionReason?: string }) => 
      apiRequest('PUT', 'leave-approve', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    }
  });
}

// ============================================
// Notifications Hooks
// ============================================

export function useNotifications(unreadOnly?: boolean) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => apiRequest<Notification[]>('GET', 'notifications', { unreadOnly }, token),
    enabled: !!token
  });
}

export function useMarkNotificationRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('PUT', 'notification-read', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useMarkAllNotificationsRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => 
      apiRequest('PUT', 'notifications-read-all', {}, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

// ============================================
// AI Chat Hook
// ============================================

export function useAIChat() {
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { message: string; model?: string; history?: Array<{ role: string; content: string }> }) => {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      });
      return response.json();
    }
  });
}

// ============================================
// Additional Supplier Hooks
// ============================================

export function useUpdateSupplier() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Supplier>) => 
      apiRequest<Supplier>('PUT', 'supplier', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

export function useDeleteSupplier() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'supplier', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

// ============================================
// Additional Material Hooks
// ============================================

export function useUpdateMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Material>) => 
      apiRequest<Material>('PUT', 'material', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  });
}

export function useDeleteMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'material', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  });
}

// ============================================
// Additional Contract Hooks
// ============================================

export function useUpdateContract() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Contract>) => 
      apiRequest<Contract>('PUT', 'contract', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    }
  });
}

export function useDeleteContract() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'contract', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    }
  });
}

// ============================================
// Additional Proposal Hooks
// ============================================

export function useUpdateProposal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Proposal>) => 
      apiRequest<Proposal>('PUT', 'proposal', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    }
  });
}

export function useDeleteProposal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'proposal', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    }
  });
}

// ============================================
// Attendance Hooks
// ============================================

export function useAttendances(userId?: string, startDate?: string, endDate?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['attendances', userId, startDate, endDate],
    queryFn: () => apiRequest('GET', 'attendance', { userId, startDate, endDate }, token),
    enabled: !!token
  });
}

// ============================================
// Expense Hooks
// ============================================

export function useExpenses(projectId?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => apiRequest('GET', 'expenses', { projectId }, token),
    enabled: !!token
  });
}

export function useCreateExpense() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', 'expense', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });
}

// ============================================
// Budget Hooks
// ============================================

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

export function useBudgets(projectId?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['budgets', projectId],
    queryFn: () => apiRequest<Budget[]>('GET', 'budgets', projectId ? { projectId } : {}, token),
    enabled: !!token
  });
}

export function useCreateBudget() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Budget>) => 
      apiRequest<Budget>('POST', 'budget', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.projectId] });
    }
  });
}

export function useUpdateBudget() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Budget>) => 
      apiRequest<Budget>('PUT', 'budget', data, token),
    onSuccess: (_, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });
}

export function useDeleteBudget() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'budget', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });
}

// ============================================
// Defect Hooks
// ============================================

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

// Helper for Defect API calls
async function defectApiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  token?: string | null
): Promise<ApiResponse<T>> {
  const isGet = method === 'GET';
  const url = isGet && data 
    ? `/api/defects?${new URLSearchParams(data).toString()}`
    : '/api/defects';
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  if (data && !isGet) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

export function useDefects(projectId?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['defects', projectId],
    queryFn: () => defectApiRequest<Defect[]>(projectId ? { projectId } : {}, token),
    enabled: !!token
  });
}

export function useCreateDefect() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Defect>) => 
      defectApiRequest<Defect>('POST', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['defects', variables.projectId] });
    }
  });
}

export function useUpdateDefect() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Defect>) => 
      defectApiRequest<Defect>('PUT', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
    }
  });
}

export function useDeleteDefect() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      defectApiRequest('DELETE', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
    }
  });
}

// ============================================
// Profile Hooks
// ============================================

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

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Helper for profile API calls
async function profileApiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  token?: string | null
): Promise<ApiResponse<T>> {
  const url = `/api/profile${endpoint ? '/' + endpoint : ''}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

export function useProfile() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApiRequest<User>('GET', '', {}, token),
    enabled: !!token
  });
}

export function useUpdateProfile() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ProfileUpdate) => 
      profileApiRequest<User>('PUT', '', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

export function useChangePassword() {
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: (data: PasswordChange) => 
      profileApiRequest('PUT', 'password', data, token)
  });
}

export function useUploadAvatar() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

export function useDeleteAvatar() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

// ============================================
// File Upload Hook
// ============================================

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

export function useUploadFile() {
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (file: File): Promise<ApiResponse<UploadResult>> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      return response.json();
    }
  });
}

export function useUploadMultipleFiles() {
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (files: File[]): Promise<ApiResponse<UploadResult[]>> => {
      const results: UploadResult[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: formData
        });
        
        const result = await response.json();
        if (result.success) {
          results.push(result.data);
        } else {
          return { success: false, error: result.error };
        }
      }
      
      return { success: true, data: results };
    }
  });
}

// ============================================
// Vouchers Hooks
// ============================================

export interface VoucherFilters {
  voucherType?: 'receipt' | 'payment';
  status?: string;
}

export function useVouchers(filters?: VoucherFilters) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['vouchers', filters],
    queryFn: () => apiRequest<Voucher[]>('GET', 'vouchers', filters, token),
    enabled: !!token
  });
}

export function useVoucher(id: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['voucher', id],
    queryFn: () => apiRequest<Voucher>('GET', 'voucher', { id }, token),
    enabled: !!token && !!id
  });
}

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

export function useCreateVoucher() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateVoucherData) => 
      apiRequest<{ id: string; voucherNumber: string }>('POST', 'voucher', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useDeleteVoucher() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'voucher', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    }
  });
}

// ============================================
// Report Export Hook
// ============================================

export type ExportType = 'pdf' | 'excel';
export type ReportType = 'financial' | 'projects' | 'tasks' | 'clients' | 'invoices';

export interface ExportParams {
  type: ExportType;
  report: ReportType;
  startDate?: string;
  endDate?: string;
  language?: 'ar' | 'en';
}

export function useExportReport() {
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (params: ExportParams): Promise<boolean> => {
      const queryParams = new URLSearchParams();
      queryParams.set('type', params.type);
      queryParams.set('report', params.report);
      if (params.startDate) queryParams.set('startDate', params.startDate);
      if (params.endDate) queryParams.set('endDate', params.endDate);
      if (params.language) queryParams.set('language', params.language);
      
      const response = await fetch(`/api/reports/export?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${params.report}-report.${params.type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    }
  });
}

// ============================================
// Users Hooks (Admin)
// ============================================

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

export function useUsers() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<AdminUser[]>('GET', 'users', {}, token),
    enabled: !!token
  });
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: string;
}

export function useCreateUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserData) => 
      apiRequest<AdminUser>('POST', 'user', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export interface UpdateUserData {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export function useUpdateUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateUserData) => 
      apiRequest<AdminUser>('PUT', 'user', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useDeleteUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', 'user', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

// ============================================
// BOQ (Bill of Quantities) Hooks
// ============================================

// Helper for BOQ API calls
async function boqApiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  token?: string | null
): Promise<ApiResponse<T>> {
  const isGet = method === 'GET';
  const url = isGet && data 
    ? `/api/boq?${new URLSearchParams(data).toString()}`
    : '/api/boq';
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  if (data && !isGet) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

export function useBOQItems(projectId?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['boq-items', projectId],
    queryFn: () => boqApiRequest<BOQItem[]>(projectId ? { projectId } : {}, token),
    enabled: !!token
  });
}

export function useCreateBOQItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<BOQItem>) => 
      boqApiRequest<BOQItem>('POST', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boq-items', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    }
  });
}

export function useUpdateBOQItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; projectId?: string } & Partial<BOQItem>) => 
      boqApiRequest<BOQItem>('PUT', data, token),
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: ['boq-items', variables.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      }
    }
  });
}

export function useDeleteBOQItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, projectId: _projectId }: { id: string; projectId?: string }) => 
      boqApiRequest('DELETE', { id }, token),
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: ['boq-items', variables.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      }
    }
  });
}

// ============================================
// Purchase Orders Hooks
// ============================================

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

// Helper for PO API calls
async function poApiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  token?: string | null
): Promise<ApiResponse<T>> {
  const isGet = method === 'GET';
  const url = isGet && data 
    ? `/api/purchase-orders?${new URLSearchParams(data).toString()}`
    : '/api/purchase-orders';
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  if (data && !isGet) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

export function usePurchaseOrders(projectId?: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['purchase-orders', projectId],
    queryFn: () => poApiRequest<PurchaseOrder[]>(projectId ? { projectId } : {}, token),
    enabled: !!token
  });
}

export function useCreatePurchaseOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<PurchaseOrder>) => 
      poApiRequest<PurchaseOrder>('POST', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  });
}

export function useUpdatePurchaseOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<PurchaseOrder>) => 
      poApiRequest<PurchaseOrder>('PUT', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  });
}

export function useDeletePurchaseOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      poApiRequest('DELETE', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  });
}
