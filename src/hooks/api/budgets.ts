/**
 * Budgets API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Budget } from './common';

export function useBudgets(projectId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['budgets', projectId],
    queryFn: () => apiRequest<Budget[]>('GET', 'budgets', projectId ? { projectId } : {}, token),
    enabled: !!token,
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
    },
  });
}

export function useUpdateBudget() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Budget>) =>
      apiRequest<Budget>('PUT', 'budget', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
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
    },
  });
}
