import { describe, it, expect, beforeEach, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { sendPasswordResetEmail } from '../../src/services/emailService';

vi.mock('nodemailer');

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('FRONTEND_URL', 'http://localhost:3000');
    vi.stubEnv('SMTP_HOST', 'smtp.test.com');
    vi.stubEnv('SMTP_PORT', '587');
    vi.stubEnv('SMTP_SECURE', 'false');
    vi.stubEnv('SMTP_USER', 'test@example.com');
    vi.stubEnv('SMTP_PASS', 'password');
    vi.stubEnv('MAIL_FROM', 'noreply@example.com');
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email successfully', async () => {
      const mockSendMail = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      const email = 'user@example.com';
      const resetToken = 'test-token-123';

      await sendPasswordResetEmail(email, resetToken);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: email,
          subject: expect.stringContaining('Reset your EduTrail password'),
        })
      );
    });

    it('should include the reset URL in the email', async () => {
      const mockSendMail = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      const email = 'user@example.com';
      const resetToken = 'test-token-123';

      await sendPasswordResetEmail(email, resetToken);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain(`http://localhost:3000/reset-password/${resetToken}`);
      expect(callArgs.html).toContain(`http://localhost:3000/reset-password/${resetToken}`);
    });

    it('should throw error when SMTP is not configured', async () => {
      vi.stubEnv('SMTP_HOST', '');
      vi.stubEnv('SMTP_USER', '');
      vi.stubEnv('SMTP_PASS', '');

      await expect(sendPasswordResetEmail('user@example.com', 'token')).rejects.toThrow(
        'SMTP is not configured'
      );
    });

    it('should include both text and HTML versions', async () => {
      const mockSendMail = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      const email = 'user@example.com';
      const resetToken = 'test-token-123';

      await sendPasswordResetEmail(email, resetToken);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toBeDefined();
      expect(callArgs.html).toBeDefined();
      expect(callArgs.text.length).toBeGreaterThan(0);
      expect(callArgs.html.length).toBeGreaterThan(0);
    });

    it('should handle email sending failures', async () => {
      const mockSendMail = vi.fn().mockRejectedValue(new Error('SMTP Error'));
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      await expect(sendPasswordResetEmail('user@example.com', 'token')).rejects.toThrow(
        'SMTP Error'
      );
    });

    it('should use custom frontend URL from environment', async () => {
      vi.stubEnv('FRONTEND_URL', 'https://custom.com');

      const mockSendMail = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      const email = 'user@example.com';
      const resetToken = 'test-token-123';

      await sendPasswordResetEmail(email, resetToken);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('https://custom.com/reset-password/test-token-123');
    });

    it('should use custom MAIL_FROM environment variable', async () => {
      vi.stubEnv('MAIL_FROM', 'custom@example.com');

      const mockSendMail = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      await sendPasswordResetEmail('user@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.from).toBe('custom@example.com');
    });
  });
});
