import nodemailer from 'nodemailer';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;

const isConfigured = Boolean(smtpHost && smtpUser && smtpPass && mailFrom);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // Builds the frontend reset URL and sends it via the configured SMTP transport.
  // Send the reset link only after the controller has created a valid reset token.
  if (!transporter || !mailFrom) {
    throw new Error('SMTP is not configured');
  }

  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: mailFrom,
    to: email,
    subject: 'Reset your EduTrail password',
    text: `You requested a password reset. Open this link to set a new password: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 16px;">Reset your EduTrail password</h2>
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Reset password</a>
        </p>
        <p style="font-size: 14px; color: #475569;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
