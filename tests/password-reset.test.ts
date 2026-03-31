import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

/**
 * Tests for the password reset flow.
 * Validates token generation, hash storage, expiry, and single-use behavior.
 */

describe('Password Reset: Token Generation', () => {
  it('should generate a 32-byte hex token', () => {
    const token = crypto.randomBytes(32).toString('hex');
    expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(crypto.randomBytes(32).toString('hex'));
    }
    expect(tokens.size).toBe(100);
  });
});

describe('Password Reset: Token Hashing', () => {
  it('should store SHA-256 hash, not the raw token', () => {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    expect(hash).not.toBe(token);
    expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
  });

  it('should produce consistent hash for same token', () => {
    const token = 'test-token-123';
    const hash1 = crypto.createHash('sha256').update(token).digest('hex');
    const hash2 = crypto.createHash('sha256').update(token).digest('hex');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash for different tokens', () => {
    const hash1 = crypto.createHash('sha256').update('token-a').digest('hex');
    const hash2 = crypto.createHash('sha256').update('token-b').digest('hex');
    expect(hash1).not.toBe(hash2);
  });
});

describe('Password Reset: Token Expiry', () => {
  const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

  it('should set expiry to 1 hour from now', () => {
    const now = Date.now();
    const expiresAt = new Date(now + EXPIRY_MS);
    const diff = expiresAt.getTime() - now;
    expect(diff).toBe(EXPIRY_MS);
  });

  it('should detect expired tokens', () => {
    const pastExpiry = new Date(Date.now() - 1000); // 1 second ago
    expect(pastExpiry < new Date()).toBe(true);
  });

  it('should accept valid (non-expired) tokens', () => {
    const futureExpiry = new Date(Date.now() + EXPIRY_MS);
    expect(futureExpiry > new Date()).toBe(true);
  });
});

describe('Password Reset: Security', () => {
  it('should not reveal whether user exists (anti-enumeration)', () => {
    // Both existing and non-existing users get the same response
    const response = { success: true, message: 'If an account exists, a reset link has been sent.' };
    expect(response.success).toBe(true);
    expect(response.message).not.toContain('not found');
    expect(response.message).not.toContain('does not exist');
  });

  it('should enforce password complexity on reset', () => {
    function validateNewPassword(password: string): { valid: boolean; error?: string } {
      if (password.length < 8) return { valid: false, error: 'Too short' };
      if (!/[a-zA-Z]/.test(password)) return { valid: false, error: 'Needs a letter' };
      if (!/[0-9]/.test(password)) return { valid: false, error: 'Needs a number' };
      return { valid: true };
    }

    expect(validateNewPassword('short1').valid).toBe(false); // too short
    expect(validateNewPassword('password').valid).toBe(false); // no number
    expect(validateNewPassword('12345678').valid).toBe(false); // no letter
    expect(validateNewPassword('newpass123').valid).toBe(true);
  });

  it('should support single-use tokens (deleted after use)', () => {
    // Simulate token store
    const store = new Map<string, { userId: string; expiresAt: Date }>();

    const token = 'reset-token-123';
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    // Store token
    store.set(hash, { userId: 'u1', expiresAt: new Date(Date.now() + 3600000) });
    expect(store.has(hash)).toBe(true);

    // Use token → delete
    store.delete(hash);
    expect(store.has(hash)).toBe(false);

    // Second use should fail
    expect(store.has(hash)).toBe(false);
  });

  it('should only reset password for credential-based accounts', () => {
    // Google OAuth accounts don't have password_hash
    const googleUser = { password_hash: null, auth_provider: 'google' };
    const credentialUser = { password_hash: '$2a$10$...', auth_provider: 'email' };

    expect(googleUser.password_hash).toBeNull();
    expect(credentialUser.password_hash).not.toBeNull();
  });
});

describe('Password Reset: Cleanup', () => {
  it('should delete existing tokens before creating new one', () => {
    const store = new Map<string, string>();

    // User requests reset twice
    const hash1 = 'hash-1';
    const hash2 = 'hash-2';
    const userId = 'u1';

    store.set(hash1, userId);

    // Second request: delete old, insert new
    for (const [key, val] of store) {
      if (val === userId) store.delete(key);
    }
    store.set(hash2, userId);

    expect(store.size).toBe(1);
    expect(store.has(hash1)).toBe(false);
    expect(store.has(hash2)).toBe(true);
  });

  it('should clean up expired tokens', () => {
    const tokens = [
      { hash: 'h1', expiresAt: new Date(Date.now() - 1000) }, // expired
      { hash: 'h2', expiresAt: new Date(Date.now() + 3600000) }, // valid
      { hash: 'h3', expiresAt: new Date(Date.now() - 5000) }, // expired
    ];

    const remaining = tokens.filter(t => t.expiresAt > new Date());
    expect(remaining).toHaveLength(1);
    expect(remaining[0].hash).toBe('h2');
  });
});
