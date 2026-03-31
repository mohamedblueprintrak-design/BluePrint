/**
 * Tasks API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Task, FilterOptions } from '@/types';

export function useTasks(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => apiRequest<Task[]>('GET', 'tasks', filters, token),
    enabled: !!token,
  });
}

export function useTask(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => apiRequest<Task>('GET', 'task', { id }, token),
    enabled: !!token && !!id,
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
    },
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
    },
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
    },
  });
}
