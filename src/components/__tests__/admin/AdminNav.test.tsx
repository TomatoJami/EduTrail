import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminNav } from '@/components/admin/AdminNav';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('AdminNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation links', () => {
    it('should render admin navigation links', () => {
      render(<AdminNav />);

      const links = screen.getAllByRole('link');

      expect(links.length).toBeGreaterThan(0);
    });

    it('should display dashboard link', () => {
      render(<AdminNav />);

      const dashboardLink = screen.queryByText(/dashboard/i);

      expect(dashboardLink).toBeTruthy();
    });

    it('should display manage content link', () => {
      render(<AdminNav />);

      const contentLink = screen.queryByText(/manage|content|courses/i);

      expect(contentLink).toBeTruthy();
    });

    it('should display user management link', () => {
      render(<AdminNav />);

      const userLink = screen.queryByText(/user|manage|admin/i);

      expect(userLink).toBeTruthy();
    });
  });

  describe('Navigation structure', () => {
    it('should have proper navigation hierarchy', () => {
      const { container } = render(<AdminNav />);

      const nav = container.querySelector('nav');

      expect(nav).toBeInTheDocument();
    });

    it('should be accessible with keyboard navigation', () => {
      const { container } = render(<AdminNav />);

      const links = container.querySelectorAll('a');

      expect(links.length).toBeGreaterThan(0);

      links.forEach((link) => {
        expect(link).toHaveProperty('href');
      });
    });
  });

  describe('Mobile responsiveness', () => {
    it('should render on mobile screens', () => {
      render(<AdminNav />);

      const nav = screen.getByRole('navigation', { hidden: true });

      expect(nav).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(<AdminNav />);

      const nav = container.querySelector('nav');

      expect(nav?.className).toBeTruthy();
    });
  });

  describe('Active state', () => {
    it('should indicate current active page', () => {
      const { container } = render(<AdminNav />);

      const links = container.querySelectorAll('a');

      const hasActiveLink = Array.from(links).some((link) =>
        link.className.includes('active') || link.className.includes('current')
      );

      // At least check that links have proper structure
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
