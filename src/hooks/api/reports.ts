/**
 * Report Export API hooks
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import type { ExportParams } from './common';

export function useExportReport() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (params: ExportParams): Promise<boolean> => {
      const queryParams = new URLSearchParams();
      queryParams.set('type', params.type);
      queryParams.set('report', params.report);
      if (params.startDate) queryParams.set('startDate', params.startDate);
      if (params.endDate) queryParams.set('endDate', params.endDate);
      if (params.language) queryParams.set('language', params.language);

      const response = await fetch(`/api/reports/export?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${params.report}-report.${params.type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return true;
    },
  });
}
