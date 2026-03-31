/**
 * Site Reports API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { SiteReport } from '@/types';

export function useSiteReports(projectId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['site-reports', projectId],
    queryFn: () => apiRequest<SiteReport[]>('GET', 'site-reports', { projectId }, token),
    enabled: !!token,
  });
}

export function useCreateSiteReport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SiteReport>) =>
      apiRequest<SiteReport>('POST', 'site-report', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-reports'] });
    },
  });
}
