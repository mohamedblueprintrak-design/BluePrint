/**
 * Leave Requests API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { LeaveRequest } from '@/types';

export function useLeaveRequests(status?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['leave-requests', status],
    queryFn: () => apiRequest<LeaveRequest[]>('GET', 'leave-requests', { status }, token),
    enabled: !!token,
  });
}

export function useCreateLeaveRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeaveRequest>) =>
      apiRequest<LeaveRequest>('POST', 'leave-request', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; approve: boolean; rejectionReason?: string }) =>
      apiRequest('PUT', 'leave-approve', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}
