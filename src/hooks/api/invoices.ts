/**
 * Invoices API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Invoice, FilterOptions } from '@/types';

export function useInvoices(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => apiRequest<Invoice[]>('GET', 'invoices', filters, token),
    enabled: !!token,
  });
}

export function useInvoice(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => apiRequest<Invoice>('GET', 'invoice', { id }, token),
    enabled: !!token && !!id,
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
    },
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
    },
  });
}
