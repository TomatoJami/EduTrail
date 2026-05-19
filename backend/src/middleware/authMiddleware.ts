import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { verifyAuthToken } from '../services/jwtService';

/** Defines the TypeScript shape for auth request. */
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'student' | 'admin';
}

/** Retrieves bearer token data. */
function getBearerToken(req: Request) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}

/** Keeps the auth middleware logic isolated and reusable. */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  const payload = token ? verifyAuthToken(token) : null;
  const userId = payload?.sub;
  const headerUserId = req.headers['x-user-id'] as string | undefined;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or expired token',
    });
  }

  if (headerUserId && headerUserId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: token does not match requested user',
    });
  }

  const user = await User.findById(userId).select('role');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: user not found',
    });
  }

  req.userId = userId;
  req.userRole = user.role;
  next();
}

/** Attaches auth context when a valid token exists, but allows anonymous reads. */
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  const payload = token ? verifyAuthToken(token) : null;
  const userId = payload?.sub;
  const headerUserId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    return next();
  }

  if (!mongoose.isValidObjectId(userId)) {
    return next();
  }

  if (headerUserId && headerUserId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: token does not match requested user',
    });
  }

  const user = await User.findById(userId).select('role');
  if (user) {
    req.userId = userId;
    req.userRole = user.role;
  }

  next();
}

/** Keeps the admin middleware logic isolated and reusable. */
export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  const payload = token ? verifyAuthToken(token) : null;
  const userId = payload?.sub;
  const headerUserId = req.headers['x-user-id'] as string | undefined;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or expired token',
    });
  }

  if (headerUserId && headerUserId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: token does not match requested user',
    });
  }

  const user = await User.findById(userId).select('role');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: user not found',
    });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: admin access required',
    });
  }

  req.userId = userId;
  req.userRole = user.role;
  next();
}

/** Keeps the logging middleware logic isolated and reusable. */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  next();
}

/** Keeps the error handler logic isolated and reusable. */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
}
