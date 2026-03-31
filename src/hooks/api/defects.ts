/**
 * Defects API hooks
 *
 * Uses the direct `/api/defects` endpoint (not the `?action=` pattern).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { directApiRequest } from '@/lib/api/fetch-client';
import type { Defect } from './common';

export function useDefects(projectId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['defects', projectId],
    queryFn: () =>
      directApiRequest<Defect[]>('GET', '/api/defects', projectId ? { projectId } : undefined, token),
    enabled: !!token,
  });
}

export function useCreateDefect() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Defect>) =>
      directApiRequest<Defect>('POST', '/api/defects', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['defects', variables.projectId] });
    },
  });
}

export function useUpdateDefect() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Defect>) =>
      directApiRequest<Defect>('PUT', '/api/defects', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
    },
  });
}

export function useDeleteDefect() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      directApiRequest('DELETE', '/api/defects', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
    },
  });
}
