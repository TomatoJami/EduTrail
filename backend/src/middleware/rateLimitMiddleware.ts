import rateLimit from 'express-rate-limit';

const standardLimitOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

// Limits noisy auth traffic without exposing whether a specific account exists.
export const authRateLimiter = rateLimit({
  ...standardLimitOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

// Password reset endpoints are stricter because they can trigger outbound email.
export const passwordResetRateLimiter = rateLimit({
  ...standardLimitOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
  },
});
