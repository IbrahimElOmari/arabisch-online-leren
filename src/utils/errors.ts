/**
 * Application Error Handling
 * Provides uniform error types and handling
 */

export enum ErrorCode {
  // Database errors
  DB_NOT_FOUND = 'DB_NOT_FOUND',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  
  // Authorization errors
  RLS_DENIED = 'RLS_DENIED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  ENROLLMENT_ALREADY_EXISTS = 'ENROLLMENT_ALREADY_EXISTS',
  CLASS_AT_CAPACITY = 'CLASS_AT_CAPACITY',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PLACEMENT_TEST_NOT_FOUND = 'PLACEMENT_TEST_NOT_FOUND',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly cause?: Error;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    cause?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.cause = cause;
    this.metadata = metadata;
    
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Maps Supabase errors to AppError
 */
export function mapSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const supabaseError = error as { code?: string; message?: string; details?: string };
  
  // PostgreSQL error codes
  if (supabaseError.code === 'PGRST116') {
    return new AppError(
      ErrorCode.DB_NOT_FOUND,
      'Resource not found',
      404,
      true,
      error as Error
    );
  }
  
  if (supabaseError.code === '23505') {
    return new AppError(
      ErrorCode.DB_CONSTRAINT_VIOLATION,
      'Duplicate entry',
      409,
      true,
      error as Error
    );
  }
  
  if (supabaseError.code === '23503') {
    return new AppError(
      ErrorCode.DB_CONSTRAINT_VIOLATION,
      'Foreign key violation',
      400,
      true,
      error as Error
    );
  }

  // RLS policy violation
  if (supabaseError.message?.includes('row-level security')) {
    return new AppError(
      ErrorCode.RLS_DENIED,
      'Access denied',
      403,
      true,
      error as Error
    );
  }

  // Auth errors
  if (supabaseError.message?.includes('JWT') || supabaseError.message?.includes('token')) {
    return new AppError(
      ErrorCode.AUTH_REQUIRED,
      'Authentication required',
      401,
      true,
      error as Error
    );
  }

  // Default to internal error
  return new AppError(
    ErrorCode.INTERNAL_ERROR,
    supabaseError.message || 'An unexpected error occurred',
    500,
    false,
    error as Error
  );
}

/**
 * Error response for API
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
}

export function toErrorResponse(error: AppError): ErrorResponse {
  return {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    metadata: error.metadata
  };
}
