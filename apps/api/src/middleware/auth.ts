import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../config/prisma';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    phone: string;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  return requireRole('ADMIN')(req, res, next);
}

export async function requireOwnership(
  req: AuthRequest, 
  _res: Response, 
  next: NextFunction
): Promise<void> {
  const userId = req.params.userId || req.body.userId;
  if (userId && req.user?.userId !== userId && req.user?.role !== 'ADMIN') {
    next(new ForbiddenError('Access to this resource is denied'));
    return;
  }
  next();
}
