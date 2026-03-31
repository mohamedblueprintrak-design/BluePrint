/**
 * Suppliers API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Supplier, FilterOptions } from '@/types';

export function useSuppliers(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => apiRequest<Supplier[]>('GET', 'suppliers', filters, token),
    enabled: !!token,
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
    },
  });
}

export function useUpdateSupplier() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Supplier>) =>
      apiRequest<Supplier>('PUT', 'supplier', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
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
    },
  });
}
