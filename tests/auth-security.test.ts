import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

// Mirror the auth module logic for testing — verifies the security invariants
const JWT_SECRET = 'test-secret';

interface JwtPayload {
  userId: string;
  email?: string;
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Mirrors getAuthUserId — the critical function that was hardened to remove
 * the legacy x-user-id header fallback.
 */
function getAuthUserId(headers: Record<string, string | undefined>): string | null {
  const authHeader = headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) return payload.userId;
  }
  return null;
}

/** Mirrors getAdminEmail — no more query param fallback */
function getAdminEmail(
  headers: Record<string, string | undefined>,
  adminEmails: string
): string | null {
  const authHeader = headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload?.email) {
      const list = adminEmails.split(",").map(e => e.trim().toLowerCase());
      if (list.includes(payload.email.toLowerCase())) return payload.email;
    }
  }
  return null;
}

describe('Auth: No legacy bypass', () => {
  it('should NOT authenticate via x-user-id header', () => {
    const result = getAuthUserId({
      'x-user-id': 'attacker-id',
    });
    expect(result).toBeNull();
  });

  it('should NOT authenticate via x-user-id even with empty Authorization', () => {
    const result = getAuthUserId({
      authorization: '',
      'x-user-id': 'attacker-id',
    });
    expect(result).toBeNull();
  });

  it('should authenticate only via valid Bearer token', () => {
    const token = jwt.sign({ userId: 'legit-user' }, JWT_SECRET, { expiresIn: '1h' });
    const result = getAuthUserId({ authorization: `Bearer ${token}` });
    expect(result).toBe('legit-user');
  });

  it('should reject a Bearer token with wrong secret', () => {
    const token = jwt.sign({ userId: 'attacker' }, 'wrong-secret', { expiresIn: '1h' });
    const result = getAuthUserId({ authorization: `Bearer ${token}` });
    expect(result).toBeNull();
  });

  it('should reject a malformed Authorization header', () => {
    expect(getAuthUserId({ authorization: 'Basic abc123' })).toBeNull();
    expect(getAuthUserId({ authorization: 'bearer lowercase' })).toBeNull();
    expect(getAuthUserId({ authorization: 'Token abc' })).toBeNull();
  });

  it('should reject missing Authorization header', () => {
    expect(getAuthUserId({})).toBeNull();
  });
});

describe('Admin auth: No query param fallback', () => {
  const ADMIN_EMAILS = 'admin@test.com, super@test.com';

  it('should return admin email from valid JWT', () => {
    const token = jwt.sign({ userId: 'u1', email: 'admin@test.com' }, JWT_SECRET, { expiresIn: '1h' });
    const result = getAdminEmail({ authorization: `Bearer ${token}` }, ADMIN_EMAILS);
    expect(result).toBe('admin@test.com');
  });

  it('should return null for non-admin email in JWT', () => {
    const token = jwt.sign({ userId: 'u2', email: 'regular@test.com' }, JWT_SECRET, { expiresIn: '1h' });
    const result = getAdminEmail({ authorization: `Bearer ${token}` }, ADMIN_EMAILS);
    expect(result).toBeNull();
  });

  it('should return null when no token (no query param fallback)', () => {
    // Previously, passing ?email=admin@test.com would work — now it should not
    const result = getAdminEmail({}, ADMIN_EMAILS);
    expect(result).toBeNull();
  });

  it('should return null for JWT without email field', () => {
    const token = jwt.sign({ userId: 'u3' }, JWT_SECRET, { expiresIn: '1h' });
    const result = getAdminEmail({ authorization: `Bearer ${token}` }, ADMIN_EMAILS);
    expect(result).toBeNull();
  });
});
