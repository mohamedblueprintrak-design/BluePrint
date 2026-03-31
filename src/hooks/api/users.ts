/**
 * Users (Admin) API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { AdminUser, CreateUserData, UpdateUserData } from './common';

export function useUsers() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<AdminUser[]>('GET', 'users', {}, token),
    enabled: !!token,
  });
}

export function useCreateUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserData) =>
      apiRequest<AdminUser>('POST', 'user', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserData) =>
      apiRequest<AdminUser>('PUT', 'user', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', 'user', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
