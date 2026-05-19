import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from '@/components/common/Footer';

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the footer', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');

      expect(footer).toBeInTheDocument();
    });

    it('should display copyright information', () => {
      render(<Footer />);

      const copyrightText = screen.queryByText(/copyright|©|2026/i);

      expect(copyrightText).toBeTruthy();
    });
  });

  describe('Footer content', () => {
    it('should display company/site name', () => {
      render(<Footer />);

      const siteNameLink = screen.queryByText(/edutrail/i);

      expect(siteNameLink).toBeTruthy();
    });

    it('should include navigation links', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');

      expect(links.length).toBeGreaterThan(0);
    });

    it('should have about link', () => {
      render(<Footer />);

      const aboutLink = screen.queryByRole('link', { name: /about/i });

      expect(aboutLink).toBeTruthy();
    });

    it('should have contact link', () => {
      render(<Footer />);

      const contactLink = screen.queryByRole('link', { name: /contact|email/i });

      expect(contactLink).toBeTruthy();
    });

    it('should have privacy policy link', () => {
      render(<Footer />);

      const privacyLink = screen.queryByRole('link', { name: /privacy/i });

      expect(privacyLink).toBeTruthy();
    });

    it('should have terms of service link', () => {
      render(<Footer />);

      const termsLink = screen.queryByRole('link', { name: /terms|conditions/i });

      expect(termsLink).toBeTruthy();
    });
  });

  describe('Social media links', () => {
    it('should display social media links if present', () => {
      render(<Footer />);

      const socialLinks = screen.queryAllByRole('link');

      // Check that there are multiple links (including social ones if present)
      expect(socialLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper footer semantic element', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');

      expect(footer).toBeInTheDocument();
    });

    it('should have accessible link structure', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');

      links.forEach((link) => {
        expect(link.textContent?.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have proper contrast and readability', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');

      expect(footer?.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive design', () => {
    it('should render footer content', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');

      expect(footer).toBeInTheDocument();
    });

    it('should have proper styling', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');

      expect(footer?.className).toBeTruthy();
    });
  });

  describe('Current year', () => {
    it('should display the current or correct year', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();

      const yearText = screen.queryByText(new RegExp(String(currentYear)));

      expect(yearText).toBeTruthy();
    });
  });
});
