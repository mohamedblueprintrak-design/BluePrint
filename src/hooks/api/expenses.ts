/**
 * Expenses API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';

export function useExpenses(projectId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => apiRequest('GET', 'expenses', { projectId }, token),
    enabled: !!token,
  });
}

export function useCreateExpense() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest('POST', 'expense', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
