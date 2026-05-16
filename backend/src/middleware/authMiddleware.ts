import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { verifyAuthToken } from '../services/jwtService';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'student' | 'admin';
}

function getBearerToken(req: Request) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}

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

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const { method, url } = req;
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
}
