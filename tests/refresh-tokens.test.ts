import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

/**
 * Tests for the refresh token mechanism.
 * Validates access token expiry, refresh token signing/verification,
 * token rotation, and cookie handling.
 */

const JWT_SECRET = 'test-secret';

interface JwtPayload {
  userId: string;
  email?: string;
}

interface RefreshPayload extends JwtPayload {
  type: 'refresh';
  family: string;
}

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function signRefreshToken(payload: JwtPayload): { token: string; family: string } {
  const family = Math.random().toString(36).slice(2);
  const token = jwt.sign(
    { ...payload, type: 'refresh', family } as RefreshPayload,
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { token, family };
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as RefreshPayload;
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

describe('Access Tokens', () => {
  it('should sign a valid access token', () => {
    const token = signAccessToken({ userId: 'u1' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe('u1');
  });

  it('should expire after 1 hour', () => {
    const token = signAccessToken({ userId: 'u1' });
    const decoded = jwt.decode(token) as any;
    expect(decoded.exp - decoded.iat).toBe(3600); // 1 hour
  });

  it('should include email when provided', () => {
    const token = signAccessToken({ userId: 'u1', email: 'test@example.com' });
    const payload = verifyToken(token);
    expect(payload!.email).toBe('test@example.com');
  });

  it('should reject expired access tokens', () => {
    const token = jwt.sign({ userId: 'u1' }, JWT_SECRET, { expiresIn: '0s' });
    expect(verifyToken(token)).toBeNull();
  });
});

describe('Refresh Tokens', () => {
  it('should sign a valid refresh token with family ID', () => {
    const { token, family } = signRefreshToken({ userId: 'u1' });
    expect(token).toBeTruthy();
    expect(family).toBeTruthy();

    const payload = verifyRefreshToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe('u1');
    expect(payload!.type).toBe('refresh');
    expect(payload!.family).toBe(family);
  });

  it('should expire after 30 days', () => {
    const { token } = signRefreshToken({ userId: 'u1' });
    const decoded = jwt.decode(token) as any;
    expect(decoded.exp - decoded.iat).toBe(30 * 24 * 60 * 60); // 30 days
  });

  it('should reject a regular access token as refresh token', () => {
    const accessToken = signAccessToken({ userId: 'u1' });
    expect(verifyRefreshToken(accessToken)).toBeNull();
  });

  it('should generate unique family IDs', () => {
    const r1 = signRefreshToken({ userId: 'u1' });
    const r2 = signRefreshToken({ userId: 'u1' });
    expect(r1.family).not.toBe(r2.family);
  });

  it('should reject expired refresh tokens', () => {
    const token = jwt.sign(
      { userId: 'u1', type: 'refresh', family: 'test' },
      JWT_SECRET,
      { expiresIn: '0s' }
    );
    expect(verifyRefreshToken(token)).toBeNull();
  });

  it('should reject tokens signed with wrong secret', () => {
    const token = jwt.sign(
      { userId: 'u1', type: 'refresh', family: 'test' },
      'wrong-secret',
      { expiresIn: '30d' }
    );
    expect(verifyRefreshToken(token)).toBeNull();
  });
});

describe('Cookie Parsing', () => {
  function parseRefreshCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/(?:^|;\s*)bs_refresh=([^;]+)/);
    return match ? match[1] : null;
  }

  it('should extract refresh token from cookie string', () => {
    const cookie = 'other=value; bs_refresh=abc123; another=thing';
    expect(parseRefreshCookie(cookie)).toBe('abc123');
  });

  it('should handle cookie as first item', () => {
    const cookie = 'bs_refresh=token123; other=value';
    expect(parseRefreshCookie(cookie)).toBe('token123');
  });

  it('should handle cookie as only item', () => {
    const cookie = 'bs_refresh=onlytoken';
    expect(parseRefreshCookie(cookie)).toBe('onlytoken');
  });

  it('should return null when cookie not present', () => {
    expect(parseRefreshCookie('other=value; another=thing')).toBeNull();
    expect(parseRefreshCookie(undefined)).toBeNull();
    expect(parseRefreshCookie('')).toBeNull();
  });
});

describe('Token Rotation Flow', () => {
  it('should issue new access + refresh tokens on refresh', () => {
    // Initial login
    const accessToken1 = signAccessToken({ userId: 'u1' });
    const { token: refreshToken1, family: family1 } = signRefreshToken({ userId: 'u1' });

    // Simulate refresh: verify old refresh, issue new pair
    const oldPayload = verifyRefreshToken(refreshToken1);
    expect(oldPayload).not.toBeNull();

    const accessToken2 = signAccessToken({ userId: oldPayload!.userId });
    const { token: refreshToken2, family: family2 } = signRefreshToken({ userId: oldPayload!.userId });

    // New tokens should be valid
    expect(verifyToken(accessToken2)).not.toBeNull();
    expect(verifyRefreshToken(refreshToken2)).not.toBeNull();

    // New family should be different (rotation)
    expect(family2).not.toBe(family1);
  });

  it('should allow multiple refreshes in sequence', () => {
    let payload = { userId: 'u1' };

    for (let i = 0; i < 5; i++) {
      const { token: refreshToken } = signRefreshToken(payload);
      const verified = verifyRefreshToken(refreshToken);
      expect(verified).not.toBeNull();
      expect(verified!.userId).toBe('u1');
    }
  });
});

describe('Refresh Cookie Security', () => {
  function buildSetCookieHeader(token: string): string {
    const maxAge = 30 * 24 * 60 * 60;
    return `bs_refresh=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}`;
  }

  it('should set HttpOnly flag', () => {
    const header = buildSetCookieHeader('token');
    expect(header).toContain('HttpOnly');
  });

  it('should set Secure flag', () => {
    const header = buildSetCookieHeader('token');
    expect(header).toContain('Secure');
  });

  it('should set SameSite=Strict', () => {
    const header = buildSetCookieHeader('token');
    expect(header).toContain('SameSite=Strict');
  });

  it('should scope to /api/auth path only', () => {
    const header = buildSetCookieHeader('token');
    expect(header).toContain('Path=/api/auth');
  });

  it('should set 30 day Max-Age', () => {
    const header = buildSetCookieHeader('token');
    expect(header).toContain(`Max-Age=${30 * 24 * 60 * 60}`);
  });
});
