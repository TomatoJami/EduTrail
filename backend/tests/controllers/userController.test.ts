import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockResponse } from '../testUtils';
import { userService } from '../../src/services/userService';
import { sendPasswordResetEmail } from '../../src/services/emailService';
import { UserController } from '../../src/controllers/userController';

vi.mock('../../src/services/userService', () => ({
  userService: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    createPasswordResetToken: vi.fn(),
    resetPassword: vi.fn(),
    getUserById: vi.fn(),
    getAllUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    getWishlist: vi.fn(),
    savePreferences: vi.fn(),
    skipPreferences: vi.fn(),
  },
}));

vi.mock('../../src/services/emailService', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

describe('UserController', () => {
  const controller = new UserController();
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'a-test-secret-that-is-at-least-32-chars');
  });

  it('validates signup payloads before creating a user', async () => {
    const res = createMockResponse();

    await controller.signup({ body: { email: 'bad', password: 'weak' } } as Request, res);

    expect(userService.createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Missing required fields',
    });
  });

  it('rejects duplicate signup emails', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({ email: 'student@example.com' } as any);
    const res = createMockResponse();

    await controller.signup({
      body: {
        email: 'student@example.com',
        password: 'Strong123!',
        name: 'Student',
      },
    } as Request, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User already exists',
    });
  });

  it('creates a user and returns an auth token on signup', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue(null);
    vi.mocked(userService.createUser).mockResolvedValue({
      _id: { toString: () => userId },
      email: 'student@example.com',
      name: 'Student',
      role: 'student',
    } as any);
    const res = createMockResponse();

    await controller.signup({
      body: {
        email: 'student@example.com',
        password: 'Strong123!',
        name: 'Student',
      },
    } as Request, res);

    expect(userService.createUser).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'Strong123!',
      name: 'Student',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'User created successfully',
      data: expect.objectContaining({
        id: userId,
        token: expect.any(String),
      }),
    }));
  });

  it('returns a generic error for invalid login credentials', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue(null);
    const res = createMockResponse();

    await controller.login({
      body: {
        email: 'student@example.com',
        password: 'Wrong123!',
      },
    } as Request, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email or Password is incorrect',
    });
  });

  it('locks login after too many failed password attempts', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      loginAttempts: 4,
      lockUntil: null,
      comparePassword: vi.fn().mockResolvedValue(false),
      save,
    } as any);
    const res = createMockResponse();

    await controller.login({
      body: {
        email: 'student@example.com',
        password: 'Wrong123!',
      },
    } as Request, res);

    expect(save).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(423);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Login attempt limit exceeded. Please try again later.',
    });
  });

  it('resets login attempts and returns a token after successful login', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      _id: { toString: () => userId },
      email: 'student@example.com',
      name: 'Student',
      role: 'student',
      loginAttempts: 2,
      lockUntil: null,
      comparePassword: vi.fn().mockResolvedValue(true),
      save,
    } as any);
    const res = createMockResponse();

    await controller.login({
      body: {
        email: 'student@example.com',
        password: 'Strong123!',
      },
    } as Request, res);

    expect(save).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Login successful',
      data: expect.objectContaining({
        id: userId,
        token: expect.any(String),
      }),
    }));
  });

  it('does not reveal whether an email exists during forgot password', async () => {
    vi.mocked(userService.createPasswordResetToken).mockResolvedValue(null);
    const res = createMockResponse();

    await controller.forgotPassword({
      body: { email: 'missing@example.com' },
    } as Request, res);

    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'If the email exists, a reset email was sent',
    });
  });

  it('validates password strength before resetting password', async () => {
    const res = createMockResponse();

    await controller.resetPassword({
      body: { token: 'token', newPassword: 'weak' },
    } as Request, res);

    expect(userService.resetPassword).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Password must be at least 8 characters long',
    });
  });

  it('prevents users from reading another user profile', async () => {
    const res = createMockResponse();

    await controller.getUser({
      params: { id: userId },
      userId: '507f191e810c19729de860ea',
      userRole: 'student',
    } as unknown as Request, res);

    expect(userService.getUserById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: cannot access another user',
    });
  });

  it('allows admins to update roles', async () => {
    vi.mocked(userService.updateUser).mockResolvedValue({
      _id: { toString: () => userId },
      email: 'student@example.com',
      name: 'Student',
      role: 'admin',
    } as any);
    const res = createMockResponse();

    await controller.updateUser({
      params: { id: userId },
      userId: '507f191e810c19729de860ea',
      userRole: 'admin',
      body: { role: 'admin' },
    } as unknown as Request, res);

    expect(userService.updateUser).toHaveBeenCalledWith(userId, { role: 'admin' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('validates preference age groups', async () => {
    const res = createMockResponse();

    await controller.savePreferences({
      params: { id: userId },
      userId,
      userRole: 'student',
      body: { ageGroup: '13-18', preferredSubjects: [] },
    } as unknown as Request, res);

    expect(userService.savePreferences).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid age group',
    });
  });
});
