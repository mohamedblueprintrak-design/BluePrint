/**
 * Projects API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Project, FilterOptions } from '@/types';

export function useProjects(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => apiRequest<Project[]>('GET', 'projects', filters, token),
    enabled: !!token,
  });
}

export function useProject(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => apiRequest<Project>('GET', 'project', { id }, token),
    enabled: !!token && !!id,
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
    },
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
    },
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
    },
  });
}
