/**
 * Attendance API hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';

export function useAttendances(userId?: string, startDate?: string, endDate?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['attendances', userId, startDate, endDate],
    queryFn: () => apiRequest('GET', 'attendance', { userId, startDate, endDate }, token),
    enabled: !!token,
  });
}
