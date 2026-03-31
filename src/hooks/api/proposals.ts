/**
 * Proposals API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Proposal, FilterOptions } from '@/types';

export function useProposals(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: () => apiRequest<Proposal[]>('GET', 'proposals', filters, token),
    enabled: !!token,
  });
}

export function useCreateProposal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Proposal>) =>
      apiRequest<Proposal>('POST', 'proposal', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

export function useUpdateProposal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Proposal>) =>
      apiRequest<Proposal>('PUT', 'proposal', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

export function useDeleteProposal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', 'proposal', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}
