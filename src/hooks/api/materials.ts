/**
 * Materials API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Material, FilterOptions } from '@/types';

export function useMaterials(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['materials', filters],
    queryFn: () => apiRequest<Material[]>('GET', 'materials', filters, token),
    enabled: !!token,
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
    },
  });
}

export function useUpdateMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Material>) =>
      apiRequest<Material>('PUT', 'material', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
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
    },
  });
}
