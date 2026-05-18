import crypto from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'student' | 'admin';
  iat: number;
  exp: number;
}

const TOKEN_TTL_SECONDS = 60 * 60;

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to at least 32 characters in production');
    }

    return 'edutrail-local-development-secret-at-least-32-chars';
  }

  return secret;
}

export function createAuthToken(user: { id: string; email: string; role: 'student' | 'admin' }) {
  // Encodes only the user id, email, role, and expiry into the token payload.
  // Build a short-lived JWT that the frontend stores as an HTTP-only cookie.
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + TOKEN_TTL_SECONDS;

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: issuedAt,
    exp: expiresAt,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return {
    token: `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function verifyAuthToken(token: string): JwtPayload | null {
  // Rejects malformed, tampered, or expired tokens before middleware trusts them.
  // Verify signature and expiration before middleware trusts the request user.
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = base64UrlEncode(
    crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest()
  );

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
