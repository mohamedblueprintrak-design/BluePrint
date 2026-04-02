/**
 * Meetings API hooks
 *
 * Uses the direct `/api/meetings` endpoint (not the `?action=` pattern).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { directApiRequest } from '@/lib/api/fetch-client';

/** Meeting entity from the API */
export interface Meeting {
  id: string;
  title: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  duration: number;       // minutes
  location: string;
  type: string;           // ONLINE, ONSITE
  status: string;         // PENDING, CONFIRMED, COMPLETED, CANCELLED
  attendees: string | null; // JSON string array
  agenda: string | null;
  notes: string | null;
  projectId: string | null;
  projectName?: string;
  createdAt: string | Date;
}

export function useMeetings(filters?: { status?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['meetings', filters],
    queryFn: () =>
      directApiRequest<Meeting[]>('GET', '/api/meetings', filters, token),
    enabled: !!token,
  });
}

export function useCreateMeeting() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Meeting>) =>
      directApiRequest<Meeting>('POST', '/api/meetings', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useUpdateMeeting() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<Meeting>) =>
      directApiRequest<Meeting>('PUT', '/api/meetings', data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useDeleteMeeting() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      directApiRequest('DELETE', '/api/meetings', { id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}
