/**
 * AI Chat API hooks
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

export function useAIChat() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      message?: string;
      model?: string;
      history?: Array<{ role: string; content: string }>;
      skill?: string;
      skillParams?: Record<string, unknown>;
      pageContext?: string;
      contextType?: 'project' | 'mun' | 'financial' | 'overdue' | undefined;
    }) => {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
}
