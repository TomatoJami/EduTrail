import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware для проверки аутентификации
 * Проверяет наличие user_id в заголовках
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid user id',
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
  next();
}

/**
 * Middleware для проверки прав администратора
 */
export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid user id',
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
  next();
}

/**
 * Middleware для логирования запросов
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const { method, url } = req;
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);
  next();
}

/**
 * Middleware для обработки ошибок
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
}
