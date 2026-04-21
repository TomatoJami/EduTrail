import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware для проверки аутентификации
 * Проверяет наличие JWT токена в заголовках
 */
export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: No token provided' },
      { status: 401 }
    );
  }

  // TODO: Verify JWT token and decode user info
  // const user = verifyToken(token);

  return NextResponse.next();
}

/**
 * Middleware для логирования запросов
 */
export function loggingMiddleware(request: NextRequest) {
  const { method, url } = request;
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);
  return NextResponse.next();
}
