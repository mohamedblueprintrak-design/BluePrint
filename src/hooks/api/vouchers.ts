/**
 * Vouchers API hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';
import type { Voucher } from '@/types';
import type { VoucherFilters, CreateVoucherData } from './common';

export function useVouchers(filters?: VoucherFilters) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['vouchers', filters],
    queryFn: () => apiRequest<Voucher[]>('GET', 'vouchers', filters, token),
    enabled: !!token,
  });
}

export function useVoucher(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['voucher', id],
    queryFn: () => apiRequest<Voucher>('GET', 'voucher', { id }, token),
    enabled: !!token && !!id,
  });
}

export function useCreateVoucher() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoucherData) =>
      apiRequest<{ id: string; voucherNumber: string }>('POST', 'voucher', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteVoucher() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', 'voucher', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}
