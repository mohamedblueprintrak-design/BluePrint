/**
 * API Client - Thin Wrapper
 *
 * @deprecated Import from '@/lib/api/fetch-client' instead.
 *
 * This file re-exports everything from the unified fetch-client for backward
 * compatibility. All existing imports like `import { apiGet } from '@/lib/api-client'`
 * will continue to work without any changes.
 */

export {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUpload,
  directApiRequest,
  ApiError,
  isSuccessResponse,
  isErrorResponse,
  unwrapResponse,
} from './api/fetch-client';

export type { ApiResponse } from './api/fetch-client';
