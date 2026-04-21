import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware для обработки ошибок
 */
export function errorHandlerMiddleware(error: Error, request: NextRequest) {
  console.error(`Error in ${request.method} ${request.url}:`, error);

  return NextResponse.json(
    {
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
    { status: 500 }
  );
}

/**
 * Асинхронный обработчик для оборачивания контроллеров
 */
export const asyncHandler = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Internal Server Error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
};
