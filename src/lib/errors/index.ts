/**
 * Global Error Handler
 * معالج الأخطاء العام
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Error types
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION = 'INVALID_OPERATION',
}

// Custom error class
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly isOperational: boolean

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401)
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, 403)
  }

  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404)
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details)
  }

  static conflict(message: string): AppError {
    return new AppError(ErrorCode.CONFLICT, message, 409)
  }

  static rateLimit(): AppError {
    return new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.',
      429
    )
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, undefined, false)
  }
}

// Format error response
export function formatErrorResponse(error: unknown): {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
} {
  // Handle known app errors
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    }
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {}
    error.issues.forEach(err => {
      const path = err.path.join('.')
      if (!details[path]) {
        details[path] = []
      }
      details[path].push(err.message)
    })
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    }
  }

  // Handle Prisma errors
  if (error instanceof Error) {
    const prismaError = error as any
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return {
        success: false,
        error: {
          code: ErrorCode.DUPLICATE_ENTRY,
          message: 'A record with this value already exists',
          details: { field: prismaError.meta?.target },
        },
      }
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return {
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Record not found',
        },
      }
    }
    
    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Referenced record does not exist',
        },
      }
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message,
      },
    }
  }

  // Unknown error
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  }
}

// Create Next.js error response
export function errorResponse(error: unknown, statusCode?: number): NextResponse {
  const formatted = formatErrorResponse(error)
  const status = statusCode || (error instanceof AppError ? error.statusCode : 500)
  
  return NextResponse.json(formatted, { status })
}

// Success response helper
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  })
}

// Paginated response helper
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination,
  })
}

// Log error for debugging
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString()
  const errorInfo = error instanceof Error 
    ? { message: error.message, stack: error.stack }
    : { error: String(error) }
  
  console.error(`[${timestamp}]${context ? ` [${context}]` : ''}`, errorInfo)
}

// Async handler wrapper for route handlers
export function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return handler().catch(error => {
    logError(error)
    return errorResponse(error)
  })
}
