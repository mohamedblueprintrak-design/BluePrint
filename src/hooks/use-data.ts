'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { 
  ApiResponse, Project, Client, Invoice, Task, Supplier, Material, 
  Contract, Proposal, SiteReport, Document, LeaveRequest, Notification,
  DashboardStats, FilterOptions, PaginationOptions
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
    mutationFn: (data: { message: string; model?: string }) => 
      apiRequest<{ response: string; tokens: number }>('POST', 'ai-chat', data, token)
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
