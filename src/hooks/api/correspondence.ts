/**
 * Municipality Correspondence API hooks
 *
 * Uses the direct `/api/municipality-correspondence` endpoint.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { directApiRequest } from '@/lib/api/fetch-client';

/** Correspondence type enum values from the API (UPPERCASE) */
export type CorrespondenceType =
  | 'SUBMISSION'
  | 'RESPONSE'
  | 'REJECTION'
  | 'APPROVAL'
  | 'INQUIRY'
  | 'AMENDMENT';

/** Correspondence status enum values from the API (lowercase after normalization) */
export type CorrespondenceStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'amendment_required';

/** A single correspondence record as returned by the API */
export interface CorrespondenceRecord {
  id: string;
  projectId: string;
  correspondenceType: CorrespondenceType;
  referenceNumber: string | null;
  submissionDate: string;
  responseDate: string | null;
  subject: string | null;
  content: string | null;
  notes: string | null;
  status: CorrespondenceStatus;
  attachments: unknown | null;
  responseNotes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    fullName: string | null;
    avatar: string | null;
    email: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

/** Parameters for the correspondence list query */
export interface CorrespondenceParams {
  projectId?: string;
  status?: CorrespondenceStatus;
  type?: CorrespondenceType;
  startDate?: string;
  endDate?: string;
}

/** Data for creating a new correspondence record */
export type CreateCorrespondenceData = {
  projectId: string;
  correspondenceType: CorrespondenceType;
  referenceNumber?: string;
  submissionDate?: string;
  responseDate?: string;
  subject?: string;
  content?: string;
  notes?: string;
  status?: string;
  attachments?: unknown;
  responseNotes?: string;
};

/** Data for updating an existing correspondence record */
export type UpdateCorrespondenceData = {
  id: string;
} & Partial<CreateCorrespondenceData>;

// ─── Query Key Factory ──────────────────────────────────────────

const correspondenceKeys = {
  all: ['correspondence'] as const,
  list: (params?: CorrespondenceParams) => [...correspondenceKeys.all, params] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────

/**
 * Fetch municipality correspondence records.
 * If no projectId is provided, fetches all for the user's organization.
 */
export function useCorrespondence(params?: CorrespondenceParams) {
  const { token } = useAuth();
  return useQuery({
    queryKey: correspondenceKeys.list(params),
    queryFn: async () => {
      const response = await directApiRequest<{ correspondence: CorrespondenceRecord[] }>(
        'GET',
        '/api/municipality-correspondence',
        params as Record<string, unknown> | undefined,
        token,
      );
      return response.data?.correspondence ?? [];
    },
    enabled: !!token,
  });
}

/**
 * Create a new municipality correspondence record.
 */
export function useCreateCorrespondence() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCorrespondenceData) =>
      directApiRequest<{ correspondence: CorrespondenceRecord }>(
        'POST',
        '/api/municipality-correspondence',
        data,
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: correspondenceKeys.all });
    },
  });
}

/**
 * Update an existing municipality correspondence record.
 */
export function useUpdateCorrespondence() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCorrespondenceData) =>
      directApiRequest<{ correspondence: CorrespondenceRecord }>(
        'PUT',
        '/api/municipality-correspondence',
        data,
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: correspondenceKeys.all });
    },
  });
}

/**
 * Delete a municipality correspondence record.
 */
export function useDeleteCorrespondence() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      directApiRequest(
        'DELETE',
        '/api/municipality-correspondence',
        { id },
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: correspondenceKeys.all });
    },
  });
}
