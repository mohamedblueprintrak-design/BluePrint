/**
 * API Client
 * عميل واجهة برمجة التطبيقات
 * 
 * Centralized API request handling with error management
 */

import { ApiErrorResponse, ApiSuccessResponse } from '@/app/api/types';

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string = 'ERROR', status: number = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Default headers for API requests
 */
function getDefaultHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Make a GET request to the API
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  token?: string | null
): Promise<ApiResponse<T>> {
  const url = new URL(endpoint, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getDefaultHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Response body is not JSON
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return { success: true, data: null as T };
  }
  return JSON.parse(text);
}

/**
 * Make a POST request to the API
 */
export async function apiPost<T>(
  endpoint: string,
  data?: Record<string, unknown>,
  token?: string | null
): Promise<ApiResponse<T>> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getDefaultHeaders(token),
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Response body is not JSON
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return { success: true, data: null as T };
  }
  return JSON.parse(text);
}

/**
 * Make a PUT request to the API
 */
export async function apiPut<T>(
  endpoint: string,
  data: Record<string, unknown>,
  token?: string | null
): Promise<ApiResponse<T>> {
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: getDefaultHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Response body is not JSON
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return { success: true, data: null as T };
  }
  return JSON.parse(text);
}

/**
 * Make a DELETE request to the API
 */
export async function apiDelete<T>(
  endpoint: string,
  params?: Record<string, string>,
  token?: string | null
): Promise<ApiResponse<T>> {
  const url = new URL(endpoint, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: getDefaultHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Response body is not JSON
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return { success: true, data: null as T };
  }
  return JSON.parse(text);
}

/**
 * Upload a file to the API
 */
export async function apiUpload<T>(
  endpoint: string,
  file: File,
  token?: string | null
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Response body is not JSON
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return { success: true, data: null as T };
  }
  return JSON.parse(text);
}

/**
 * Check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Check if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Extract data from response or throw error
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  throw new ApiError(
    response.error.message,
    response.error.code,
    400
  );
}
