/**
 * Clients API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Client, FilterOptions } from '@/types';

export function useClients(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => apiRequest<Client[]>('GET', 'clients', filters, token),
    enabled: !!token,
  });
}

export function useClient(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => apiRequest<Client>('GET', 'client', { id }, token),
    enabled: !!token && !!id,
  });
}

export function useCreateClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) =>
      apiRequest<Client>('POST', 'client', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Client>) =>
      apiRequest<Client>('PUT', 'client', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export function useDeleteClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', 'client', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
