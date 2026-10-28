import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.headers['x-correlation-id'] as string;

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach(e => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors,
      correlationId,
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Application error', { err, url: req.url, correlationId });
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      correlationId,
    });
    return;
  }

  logger.error('Unhandled error', { err, url: req.url, correlationId });
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    correlationId,
  });
}
