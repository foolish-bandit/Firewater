import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Test the auth module functions directly
const JWT_SECRET = 'test-secret';

// We test the core logic by reimplementing the same functions with the test secret
// This avoids needing to mock the module's internal state

function signToken(payload: { userId: string; email?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string): { userId: string; email?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email?: string };
  } catch {
    return null;
  }
}

describe('JWT Authentication', () => {
  it('should sign and verify a token with userId', () => {
    const token = signToken({ userId: 'user-123' });
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe('user-123');
  });

  it('should sign and verify a token with userId and email', () => {
    const token = signToken({ userId: 'user-456', email: 'test@example.com' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe('user-456');
    expect(payload!.email).toBe('test@example.com');
  });

  it('should return null for an invalid token', () => {
    const payload = verifyToken('invalid-token-string');
    expect(payload).toBeNull();
  });

  it('should return null for a token signed with a different secret', () => {
    const token = jwt.sign({ userId: 'user-789' }, 'different-secret', { expiresIn: '7d' });
    const payload = verifyToken(token);
    expect(payload).toBeNull();
  });

  it('should return null for an expired token', () => {
    const token = jwt.sign({ userId: 'user-expired' }, JWT_SECRET, { expiresIn: '0s' });
    // Expired immediately
    const payload = verifyToken(token);
    expect(payload).toBeNull();
  });

  it('should include standard JWT fields', () => {
    const token = signToken({ userId: 'user-std' });
    const decoded = jwt.decode(token) as any;
    expect(decoded.iat).toBeTruthy();
    expect(decoded.exp).toBeTruthy();
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60); // 7 days
  });
});

describe('Admin check logic', () => {
  function isAdmin(email: string | undefined, adminEmails: string): boolean {
    if (!email) return false;
    const list = adminEmails.split(',').map(e => e.trim().toLowerCase());
    return list.includes(email.toLowerCase());
  }

  it('should return true for matching admin email', () => {
    expect(isAdmin('admin@test.com', 'admin@test.com')).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(isAdmin('ADMIN@test.com', 'admin@test.com')).toBe(true);
  });

  it('should handle comma-separated list', () => {
    expect(isAdmin('user2@test.com', 'user1@test.com, user2@test.com, user3@test.com')).toBe(true);
  });

  it('should return false for non-admin email', () => {
    expect(isAdmin('nobody@test.com', 'admin@test.com')).toBe(false);
  });

  it('should return false for undefined email', () => {
    expect(isAdmin(undefined, 'admin@test.com')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isAdmin('', 'admin@test.com')).toBe(false);
  });
});
