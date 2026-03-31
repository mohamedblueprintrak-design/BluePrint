/**
 * Purchase Orders API hooks
 *
 * Uses the direct `/api/purchase-orders` endpoint.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { directApiRequest } from '@/lib/api/fetch-client';
import type { PurchaseOrder } from './common';

export function usePurchaseOrders(projectId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['purchase-orders', projectId],
    queryFn: () =>
      directApiRequest<PurchaseOrder[]>('GET', '/api/purchase-orders', projectId ? { projectId } : undefined, token),
    enabled: !!token,
  });
}

export function useCreatePurchaseOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PurchaseOrder>) =>
      directApiRequest<PurchaseOrder>('POST', '/api/purchase-orders', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<PurchaseOrder>) =>
      directApiRequest<PurchaseOrder>('PUT', '/api/purchase-orders', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      directApiRequest('DELETE', '/api/purchase-orders', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}
