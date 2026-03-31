/**
 * Notifications API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Notification } from '@/types';

export function useNotifications(unreadOnly?: boolean) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => apiRequest<Notification[]>('GET', 'notifications', { unreadOnly }, token),
    enabled: !!token,
  });
}

export function useMarkNotificationRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest('PUT', 'notification-read', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest('PUT', 'notifications-read-all', {}, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
