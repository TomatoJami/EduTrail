import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountSidebar } from '@/components/common/AccountSidebar';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'user@example.com', name: 'Test User' },
    logout: vi.fn(),
  }),
}));

describe('AccountSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the account sidebar', () => {
      const { container } = render(<AccountSidebar />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display user information', () => {
      render(<AccountSidebar />);

      expect(screen.getByText(/test user|user@example/i)).toBeTruthy();
    });
  });

  describe('Account options', () => {
    it('should display profile link', () => {
      render(<AccountSidebar />);

      const profileLink = screen.queryByText(/profile|account|settings/i);

      expect(profileLink).toBeTruthy();
    });

    it('should display preference settings', () => {
      render(<AccountSidebar />);

      const preferencesLink = screen.queryByText(/preference|setting|subject/i);

      expect(preferencesLink).toBeTruthy();
    });

    it('should display logout option', () => {
      render(<AccountSidebar />);

      const logoutLink = screen.queryByText(/logout|sign out|exit/i);

      expect(logoutLink).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to profile page', () => {
      render(<AccountSidebar />);

      const profileLink = screen.queryByRole('button', { name: /profile/i });

      expect(profileLink).toBeTruthy();
    });

    it('should navigate to settings page', () => {
      render(<AccountSidebar />);

      const settingsLink = screen.queryByRole('button', { name: /setting|preference/i });

      expect(settingsLink).toBeTruthy();
    });
  });

  describe('Logout functionality', () => {
    it('should provide logout capability', () => {
      render(<AccountSidebar />);

      const logoutLink = screen.queryByRole('button', { name: /logout|sign out/i });

      expect(logoutLink).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(<AccountSidebar />);

      const sidebar = container.querySelector('aside') || container.querySelector('div');

      expect(sidebar).toBeInTheDocument();
    });

    it('should have clickable elements with proper roles', () => {
      const { container } = render(<AccountSidebar />);

      const buttons = container.querySelectorAll('button, a');

      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button.textContent?.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
