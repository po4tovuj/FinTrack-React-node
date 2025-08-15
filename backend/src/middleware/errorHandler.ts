import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error codes and their user-friendly messages
 */
const DB_ERROR_MESSAGES = {
  P2002: 'A record with this information already exists',
  P2003: 'Foreign key constraint failed',
  P2004: 'A constraint failed on the database',
  P2025: 'Record not found',
  P2014: 'The change you are trying to make would violate the required relation',
};

/**
 * Express error handling middleware
 * Catches all errors and sends appropriate responses
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle known application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode || 'APP_ERROR';
  }
  // Handle Prisma database errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    statusCode = 400;
    errorCode = prismaError.code;
    message = DB_ERROR_MESSAGES[prismaError.code as keyof typeof DB_ERROR_MESSAGES] || 'Database operation failed';
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }
  // Handle other known errors
  else if (error.message.includes('duplicate key value')) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'A record with this information already exists';
  }

  // Log error for debugging (but don't expose stack traces in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      errorCode,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
    });
  } else {
    console.error('Production error:', {
      message,
      statusCode,
      errorCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode,
      timestamp: new Date().toISOString(),
      // Include stack trace only in development
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}

/**
 * Async error wrapper for route handlers
 * Automatically catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
}