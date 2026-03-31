/**
 * Knowledge Base API hooks
 *
 * Uses the direct `/api/knowledge` endpoint.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { directApiRequest } from '@/lib/api/fetch-client';
import type { KnowledgeArticle } from './common';

export function useKnowledgeArticles(filters?: { category?: string; search?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['knowledge-articles', filters],
    queryFn: () =>
      directApiRequest<KnowledgeArticle[]>('GET', '/api/knowledge', filters, token),
    enabled: !!token,
  });
}

export function useKnowledgeArticle(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: () =>
      directApiRequest<KnowledgeArticle>('GET', '/api/knowledge', { id }, token),
    enabled: !!token && !!id,
  });
}

export function useCreateKnowledgeArticle() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KnowledgeArticle>) =>
      directApiRequest<KnowledgeArticle>('POST', '/api/knowledge', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
    },
  });
}

export function useUpdateKnowledgeArticle() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<KnowledgeArticle>) =>
      directApiRequest<KnowledgeArticle>('PUT', '/api/knowledge', data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.id] });
    },
  });
}

export function useDeleteKnowledgeArticle() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      directApiRequest('DELETE', '/api/knowledge', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
    },
  });
}

export function useMarkArticleHelpful() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      directApiRequest<KnowledgeArticle>('PUT', '/api/knowledge', { id, helpful: true }, token),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', id] });
    },
  });
}
