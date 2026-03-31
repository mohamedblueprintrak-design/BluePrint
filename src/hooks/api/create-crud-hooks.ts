/**
 * Generic CRUD Hook Factory
 *
 * Reduces boilerplate for entities that follow the standard
 * `/api?action=X` pattern. For entities with custom endpoints
 * (defects, boq, profile, etc.), use the specialized modules.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api/fetch-client';

/**
 * Options for configuring the CRUD hooks factory.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CrudHooksConfig<TEntity = unknown> {
  /** The query action used for GET list (plural, e.g. 'projects') */
  listAction: string;
  /** The query action used for GET single item (singular, e.g. 'project') */
  singleAction: string;
  /** The mutation action for POST/PUT/DELETE (singular, e.g. 'project') */
  mutationAction: string;
  /** The TanStack Query base key, e.g. 'projects' */
  queryKey: string;
  /** Additional query keys to invalidate on mutations */
  invalidateKeys?: string[][];
}

/**
 * Creates a standard set of CRUD hooks for a given entity.
 *
 * @example
 * ```ts
 * const projectHooks = createCrudHooks<Project>({
 *   listAction: 'projects',
 *   singleAction: 'project',
 *   mutationAction: 'project',
 *   queryKey: 'projects',
 *   invalidateKeys: [['dashboard']],
 * });
 *
 * // Use them:
 * const { data } = projectHooks.useAll(filters);
 * const create = projectHooks.useCreate();
 * ```
 */
export function createCrudHooks<TEntity>(config: CrudHooksConfig<TEntity>) {
  const { listAction, singleAction, mutationAction, queryKey, invalidateKeys = [] } = config;

  return {
    /** Fetch a list of entities */
    useAll: (filters?: Record<string, unknown>) => {
      const { token } = useAuth();
      return useQuery({
        queryKey: [queryKey, filters],
        queryFn: () => apiRequest<TEntity[]>('GET', listAction, filters, token),
        enabled: !!token,
      });
    },

    /** Fetch a single entity by id */
    useOne: (id: string | null) => {
      const { token } = useAuth();
      return useQuery({
        queryKey: [queryKey, id],
        queryFn: () => apiRequest<TEntity>('GET', singleAction, { id }, token),
        enabled: !!token && !!id,
      });
    },

    /** Create a new entity */
    useCreate: (options?: { invalidateExtra?: string[][] }) => {
      const { token } = useAuth();
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data: Partial<TEntity>) =>
          apiRequest<TEntity>('POST', mutationAction, data, token),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: key });
          }
          for (const key of options?.invalidateExtra || []) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        },
      });
    },

    /** Update an entity */
    useUpdate: (options?: { invalidateExtra?: string[][] }) => {
      const { token } = useAuth();
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data: { id: string } & Partial<TEntity>) =>
          apiRequest<TEntity>('PUT', mutationAction, data, token),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
          queryClient.invalidateQueries({ queryKey: [queryKey, variables.id] });
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: key });
          }
          for (const key of options?.invalidateExtra || []) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        },
      });
    },

    /** Delete an entity */
    useDelete: (options?: { invalidateExtra?: string[][] }) => {
      const { token } = useAuth();
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) =>
          apiRequest('DELETE', mutationAction, { id }, token),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: key });
          }
          for (const key of options?.invalidateExtra || []) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        },
      });
    },
  };
}
