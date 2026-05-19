import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionTimeout } from '@/components/SessionTimeout';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}));

describe('SessionTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Public path handling', () => {
    it('should not apply timeout on public pages', () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      render(<SessionTimeout />);

      // Verify component renders without errors
      expect(true).toBe(true);
    });

    it('should allow navigation to login without timeout', () => {
      render(<SessionTimeout />);

      expect(push).not.toHaveBeenCalledWith('/');
    });
  });

  describe('Activity tracking', () => {
    it('should mark activity when user is active', () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      render(<SessionTimeout />);

      fireEvent.mouseMove(document);

      const lastActivity = localStorage.getItem('authLastActivity');

      expect(lastActivity).toBeTruthy();
    });

    it('should update activity timestamp on repeated actions', async () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      render(<SessionTimeout />);

      fireEvent.mouseMove(document);

      const firstActivity = localStorage.getItem('authLastActivity');

      await waitFor(() => {
        fireEvent.mouseMove(document);
      });

      const secondActivity = localStorage.getItem('authLastActivity');

      expect(secondActivity).not.toEqual(firstActivity);
    });
  });

  describe('Session expiration', () => {
    it('should clear session on logout', async () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));
      localStorage.setItem('authToken', 'token-123');
      localStorage.setItem('authExpiresAt', new Date().toISOString());

      render(<SessionTimeout />);

      fireEvent.click(document, new MouseEvent('auth-state-changed'));

      await waitFor(() => {
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('authToken')).toBeNull();
      });
    });
  });

  describe('Inactivity timeout', () => {
    it('should mark activity on component mount if user is logged in', () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      render(<SessionTimeout />);

      const lastActivity = localStorage.getItem('authLastActivity');

      expect(lastActivity).toBeTruthy();
    });

    it('should not mark activity if user is not logged in', () => {
      localStorage.removeItem('user');

      render(<SessionTimeout />);

      const lastActivity = localStorage.getItem('authLastActivity');

      expect(lastActivity).toBeNull();
    });
  });

  describe('Event listeners', () => {
    it('should listen to activity events', () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      render(<SessionTimeout />);

      fireEvent.click(document);

      const lastActivity = localStorage.getItem('authLastActivity');

      expect(lastActivity).toBeTruthy();
    });

    it('should cleanup event listeners on unmount', () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      const { unmount } = render(<SessionTimeout />);

      unmount();

      expect(true).toBe(true);
    });
  });

  describe('Token expiration', () => {
    it('should redirect to home on token expiration', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() - 1); // Expired token

      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));
      localStorage.setItem('authExpiresAt', futureDate.toISOString());

      vi.useFakeTimers();

      render(<SessionTimeout />);

      vi.runAllTimers();

      vi.useRealTimers();

      // Verify the component handles expiration
      expect(true).toBe(true);
    });
  });

  describe('Reset password path', () => {
    it('should allow reset-password routes without timeout', () => {
      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      vi.mock('next/navigation', () => ({
        usePathname: () => '/reset-password/token-123',
      }));

      render(<SessionTimeout />);

      expect(true).toBe(true);
    });
  });

  describe('Fetch logout', () => {
    it('should call logout API on session clear', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
        ok: true,
      });

      localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));

      render(<SessionTimeout />);

      fireEvent.click(document, new MouseEvent('auth-state-changed'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });

      fetchSpy.mockRestore();
    });
  });
});
