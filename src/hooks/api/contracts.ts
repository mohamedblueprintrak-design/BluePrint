/**
 * Contracts API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Contract, FilterOptions } from '@/types';

export function useContracts(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => apiRequest<Contract[]>('GET', 'contracts', filters, token),
    enabled: !!token,
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
    },
  });
}

export function useUpdateContract() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Contract>) =>
      apiRequest<Contract>('PUT', 'contract', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
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
    },
  });
}
