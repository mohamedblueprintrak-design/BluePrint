/**
 * BOQ (Bill of Quantities) API hooks
 *
 * Uses the direct `/api/boq` endpoint (not the `?action=` pattern).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { directApiRequest } from '@/lib/api/fetch-client';
import type { BOQItem } from '@/types';

export function useBOQItems(projectId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['boq-items', projectId],
    queryFn: () =>
      directApiRequest<BOQItem[]>('GET', '/api/boq', projectId ? { projectId } : undefined, token),
    enabled: !!token,
  });
}

export function useCreateBOQItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BOQItem>) =>
      directApiRequest<BOQItem>('POST', '/api/boq', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boq-items', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
}

export function useUpdateBOQItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; projectId?: string } & Partial<BOQItem>) =>
      directApiRequest<BOQItem>('PUT', '/api/boq', data, token),
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: ['boq-items', variables.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      }
    },
  });
}

export function useDeleteBOQItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId: _projectId }: { id: string; projectId?: string }) =>
      directApiRequest('DELETE', '/api/boq', { id }, token),
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: ['boq-items', variables.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      }
    },
  });
}
