import { NextFunction, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../src/models/User';
import { createAuthToken } from '../../src/services/jwtService';
import { adminMiddleware, authMiddleware, AuthRequest } from '../../src/middleware/authMiddleware';

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function createRequest(token?: string, headerUserId?: string) {
  return {
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headerUserId ? { 'x-user-id': headerUserId } : {}),
    },
  } as AuthRequest;
}

describe('authMiddleware', () => {
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'a-test-secret-that-is-at-least-32-chars');
  });

  it('rejects missing tokens', async () => {
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(createRequest(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Unauthorized: invalid or expired token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests when token and x-user-id do not match', async () => {
    const token = createAuthToken({
      id: userId,
      email: 'student@example.com',
      role: 'student',
    }).token;
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(createRequest(token, '507f191e810c19729de860ea'), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: token does not match requested user',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches authenticated user details and calls next', async () => {
    const token = createAuthToken({
      id: userId,
      email: 'student@example.com',
      role: 'student',
    }).token;
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({ role: 'student' }),
    } as any);
    const req = createRequest(token);
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(req.userId).toBe(userId);
    expect(req.userRole).toBe('student');
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('adminMiddleware', () => {
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'a-test-secret-that-is-at-least-32-chars');
  });

  it('rejects non-admin users', async () => {
    const token = createAuthToken({
      id: userId,
      email: 'student@example.com',
      role: 'student',
    }).token;
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({ role: 'student' }),
    } as any);
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await adminMiddleware(createRequest(token), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: admin access required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows admin users', async () => {
    const token = createAuthToken({
      id: userId,
      email: 'admin@example.com',
      role: 'admin',
    }).token;
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({ role: 'admin' }),
    } as any);
    const req = createRequest(token);
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await adminMiddleware(req, res, next);

    expect(req.userId).toBe(userId);
    expect(req.userRole).toBe('admin');
    expect(next).toHaveBeenCalledOnce();
  });
});
