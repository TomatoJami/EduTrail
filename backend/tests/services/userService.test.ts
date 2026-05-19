import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../src/models/User';
import {
  getDefaultAdminCredentials,
  userService,
} from '../../src/services/userService';

describe('UserService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('DEFAULT_ADMIN_EMAIL', 'admin@example.com');
    vi.stubEnv('DEFAULT_ADMIN_PASSWORD', 'Admin123!');
  });

  it('finds users by email only', async () => {
    const defaultAdmin = getDefaultAdminCredentials();
    vi.spyOn(User, 'findOne').mockReturnValue({
      select: vi.fn().mockResolvedValue({ email: defaultAdmin.email }),
    } as any);

    const user = await userService.getUserByEmail(defaultAdmin.email);

    expect(User.findOne).toHaveBeenCalledWith({ email: defaultAdmin.email });
    expect(user).toEqual({ email: defaultAdmin.email });
  });

  it('returns an existing default admin without creating a duplicate', async () => {
    const defaultAdmin = getDefaultAdminCredentials();
    const existingAdmin = { email: defaultAdmin.email, role: 'admin' };
    vi.spyOn(User, 'findOne').mockResolvedValue(existingAdmin as any);
    const saveSpy = vi.spyOn(User.prototype, 'save');

    const result = await userService.ensureDefaultAdminUser();

    expect(User.findOne).toHaveBeenCalledWith({ email: defaultAdmin.email });
    expect(saveSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ user: existingAdmin, created: false });
  });

  it('creates the default admin when it does not exist', async () => {
    vi.stubEnv('DEFAULT_ADMIN_EMAIL', 'owner@example.com');
    vi.stubEnv('DEFAULT_ADMIN_PASSWORD', 'Owner123!');
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User.prototype, 'save').mockResolvedValue(undefined);

    const result = await userService.ensureDefaultAdminUser();

    const defaultAdmin = getDefaultAdminCredentials();
    expect(result.created).toBe(true);
    expect(result.user.email).toBe(defaultAdmin.email);
    expect(result.user.name).toBe('Administrator');
    expect(result.user.role).toBe('admin');
    expect(result.user.password).toBe(defaultAdmin.password);
  });

  it('requires default admin environment variables', () => {
    vi.unstubAllEnvs();

    expect(() => getDefaultAdminCredentials()).toThrow(
      'DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set'
    );
  });
});
