/**
 * Documents API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { ApiResponse, Document, FilterOptions } from '@/types';
import type { CreateDocumentData, UploadResult } from './common';

export function useDocuments(filters?: FilterOptions) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => apiRequest<Document[]>('GET', 'documents', filters, token),
    enabled: !!token,
  });
}

export function useCreateDocument() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentData) =>
      apiRequest<Document>('POST', 'document', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', 'document', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUploadFile() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (file: File): Promise<ApiResponse<UploadResult>> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      return response.json();
    },
  });
}

export function useUploadMultipleFiles() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (files: File[]): Promise<ApiResponse<UploadResult[]>> => {
      const results: UploadResult[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          results.push(result.data);
        } else {
          return { success: false, error: result.error } as ApiResponse<UploadResult[]>;
        }
      }

      return { success: true, data: results } as ApiResponse<UploadResult[]>;
    },
  });
}
