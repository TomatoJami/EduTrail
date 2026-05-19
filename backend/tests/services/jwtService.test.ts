import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthToken, verifyAuthToken } from '../../src/services/jwtService';

describe('jwtService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('creates a token that can be verified', () => {
    vi.stubEnv('JWT_SECRET', 'a-test-secret-that-is-at-least-32-chars');

    const authToken = createAuthToken({
      id: '507f1f77bcf86cd799439011',
      email: 'student@example.com',
      role: 'student',
    });

    const payload = verifyAuthToken(authToken.token);

    expect(payload).toMatchObject({
      sub: '507f1f77bcf86cd799439011',
      email: 'student@example.com',
      role: 'student',
    });
    expect(authToken.expiresAt).toBe(new Date((payload!.exp) * 1000).toISOString());
  });

  it('rejects malformed and tampered tokens', () => {
    vi.stubEnv('JWT_SECRET', 'a-test-secret-that-is-at-least-32-chars');

    const { token } = createAuthToken({
      id: '507f1f77bcf86cd799439011',
      email: 'student@example.com',
      role: 'student',
    });

    expect(verifyAuthToken('not-a-token')).toBeNull();
    expect(verifyAuthToken(`${token}tampered`)).toBeNull();
  });

  it('rejects expired tokens', () => {
    vi.stubEnv('JWT_SECRET', 'a-test-secret-that-is-at-least-32-chars');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const { token } = createAuthToken({
      id: '507f1f77bcf86cd799439011',
      email: 'student@example.com',
      role: 'student',
    });

    vi.setSystemTime(new Date('2026-01-01T07:00:00.000Z'));

    expect(verifyAuthToken(token)).toBeNull();
  });

  it('requires a strong JWT secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', 'short');

    expect(() =>
      createAuthToken({
        id: '507f1f77bcf86cd799439011',
        email: 'student@example.com',
        role: 'student',
      })
    ).toThrow('JWT_SECRET must be set to at least 32 characters in production');
  });
});
