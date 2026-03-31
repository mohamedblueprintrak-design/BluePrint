/**
 * Profile API hooks
 *
 * Uses the direct `/api/profile` endpoint (not the `?action=` pattern).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { directApiRequest } from '@/lib/api/fetch-client';
import type { User } from '@/types';
import type { ProfileUpdate, PasswordChange } from './common';

export function useProfile() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => directApiRequest<User>('GET', '/api/profile', {}, token),
    enabled: !!token,
  });
}

export function useUpdateProfile() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) =>
      directApiRequest<User>('PUT', '/api/profile', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useChangePassword() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (data: PasswordChange) =>
      directApiRequest('PUT', '/api/profile/password', data, token),
  });
}

export function useUploadAvatar() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteAvatar() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
