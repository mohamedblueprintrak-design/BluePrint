/**
 * Dashboard API hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { DashboardStats } from '@/types';

export function useDashboard() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<DashboardStats>('GET', 'dashboard', {}, token),
    enabled: !!token,
  });
}
