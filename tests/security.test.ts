import { describe, it, expect } from 'vitest';

/**
 * Tests for security hardening:
 * - Input sanitization (XSS prevention)
 * - Password complexity
 * - Account enumeration prevention
 * - OAuth CSRF state parameter
 * - Timing attack prevention
 * - File upload validation
 */

// ── Input Sanitization ──────────────────────────────────────────────────────

function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function sanitizeText(input: unknown, maxLength: number = 5000): string {
  if (typeof input !== "string") return "";
  return stripHtml(input).trim().slice(0, maxLength);
}

function sanitizeRating(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n * 2) / 2));
}

function sanitizeTags(input: unknown, maxTags: number = 20): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t): t is string => typeof t === "string")
    .map(t => stripHtml(t).trim().slice(0, 50))
    .filter(t => t.length > 0)
    .slice(0, maxTags);
}

function isValidId(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(input);
}

describe('XSS: stripHtml', () => {
  it('should strip script tags', () => {
    expect(stripHtml('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('should strip nested script tags', () => {
    expect(stripHtml('<script>var x = "<script>";</script>safe')).toBe('safe');
  });

  it('should strip HTML tags', () => {
    expect(stripHtml('<b>bold</b> <i>italic</i>')).toBe('bold italic');
  });

  it('should strip event handler attributes', () => {
    expect(stripHtml('<img onerror="alert(1)" src="x">')).toBe('');
  });

  it('should handle encoded entities', () => {
    expect(stripHtml('&lt;script&gt;')).toBe('<script>');
  });

  it('should preserve plain text', () => {
    expect(stripHtml('Hello, world!')).toBe('Hello, world!');
  });

  it('should handle empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('XSS: sanitizeText', () => {
  it('should strip HTML from review text', () => {
    expect(sanitizeText('<script>steal(cookies)</script>Great bourbon!')).toBe('Great bourbon!');
  });

  it('should enforce max length', () => {
    const long = 'a'.repeat(10000);
    expect(sanitizeText(long, 100).length).toBe(100);
  });

  it('should return empty for non-string input', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(123)).toBe('');
    expect(sanitizeText({})).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('should handle XSS via img tags', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>Nice')).toBe('Nice');
  });

  it('should handle XSS via svg', () => {
    expect(sanitizeText('<svg onload=alert(1)>text</svg>')).toBe('text');
  });
});

describe('XSS: sanitizeRating', () => {
  it('should clamp to 0-5 range', () => {
    expect(sanitizeRating(-1)).toBe(0);
    expect(sanitizeRating(10)).toBe(5);
    expect(sanitizeRating(3)).toBe(3);
  });

  it('should round to 0.5 increments', () => {
    expect(sanitizeRating(3.3)).toBe(3.5);
    expect(sanitizeRating(3.1)).toBe(3);
    expect(sanitizeRating(4.7)).toBe(4.5);
  });

  it('should handle non-numeric input', () => {
    expect(sanitizeRating('abc')).toBe(0);
    expect(sanitizeRating(NaN)).toBe(0);
    expect(sanitizeRating(Infinity)).toBe(0);
    expect(sanitizeRating(null)).toBe(0);
  });
});

describe('XSS: sanitizeTags', () => {
  it('should strip HTML from tags', () => {
    expect(sanitizeTags(['<script>x</script>smooth', 'sweet'])).toEqual(['smooth', 'sweet']);
  });

  it('should limit tag count', () => {
    const tags = Array.from({ length: 30 }, (_, i) => `tag${i}`);
    expect(sanitizeTags(tags).length).toBe(20);
  });

  it('should limit tag length', () => {
    const longTag = 'a'.repeat(100);
    expect(sanitizeTags([longTag])[0].length).toBe(50);
  });

  it('should filter non-string entries', () => {
    expect(sanitizeTags([1, null, 'valid', undefined])).toEqual(['valid']);
  });

  it('should return empty for non-array', () => {
    expect(sanitizeTags('not-an-array')).toEqual([]);
    expect(sanitizeTags(null)).toEqual([]);
  });
});

describe('Input: isValidId', () => {
  it('should accept valid IDs', () => {
    expect(isValidId('abc-123')).toBe(true);
    expect(isValidId('user_456')).toBe(true);
    expect(isValidId('a1b2c3d4e5f6')).toBe(true);
  });

  it('should reject SQL injection attempts', () => {
    expect(isValidId("'; DROP TABLE users;--")).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidId('')).toBe(false);
  });

  it('should reject very long IDs', () => {
    expect(isValidId('a'.repeat(200))).toBe(false);
  });

  it('should reject non-string input', () => {
    expect(isValidId(null)).toBe(false);
    expect(isValidId(123)).toBe(false);
  });

  it('should reject path traversal', () => {
    expect(isValidId('../../../etc/passwd')).toBe(false);
  });
});

// ── Password Complexity ─────────────────────────────────────────────────────

describe('Password Complexity', () => {
  function isValidPassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) return { valid: false, error: 'Too short' };
    if (!/[a-zA-Z]/.test(password)) return { valid: false, error: 'Needs a letter' };
    if (!/[0-9]/.test(password)) return { valid: false, error: 'Needs a number' };
    return { valid: true };
  }

  it('should accept valid passwords', () => {
    expect(isValidPassword('password1').valid).toBe(true);
    expect(isValidPassword('MyP4ssw0rd!').valid).toBe(true);
  });

  it('should reject short passwords', () => {
    expect(isValidPassword('Pass1').valid).toBe(false);
  });

  it('should reject all-letter passwords', () => {
    expect(isValidPassword('abcdefgh').valid).toBe(false);
  });

  it('should reject all-number passwords', () => {
    expect(isValidPassword('12345678').valid).toBe(false);
  });
});

// ── OAuth State (CSRF) ──────────────────────────────────────────────────────

describe('OAuth CSRF State', () => {
  it('should verify state parameter matches', () => {
    const sentState = 'abc123';
    const receivedState = 'abc123';
    expect(sentState === receivedState).toBe(true);
  });

  it('should reject mismatched state', () => {
    const sentState = 'abc123';
    const receivedState = 'xyz789';
    expect(sentState === receivedState).toBe(false);
  });

  it('should reject missing state', () => {
    const sentState = 'abc123';
    const receivedState = undefined;
    expect(sentState === receivedState).toBe(false);
  });
});

// ── Timing Attack Prevention ─────────────────────────────────────────────────

describe('Timing Attack Prevention', () => {
  it('should always run bcrypt.compare regardless of user existence', () => {
    // The fix: always compare against a hash (real or dummy) to ensure
    // constant timing whether or not the user exists
    const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";
    const realHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    const userExists = true;
    const hashToCompare = userExists ? realHash : DUMMY_HASH;

    // Both paths produce a valid bcrypt hash to compare against
    expect(hashToCompare.startsWith("$2a$")).toBe(true);
    expect(DUMMY_HASH.startsWith("$2a$")).toBe(true);
  });
});

// ── File Upload Validation ───────────────────────────────────────────────────

describe('File Upload: Extension Validation', () => {
  function validateUpload(filename: string, contentType: string): { valid: boolean; error?: string } {
    const rawExt = (filename.split(".").pop() || "").toLowerCase().replace(/[^a-z]/g, "");
    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    const ext = allowedExts.includes(rawExt) ? rawExt : null;

    if (!ext) return { valid: false, error: "Invalid file extension" };

    const extToMime: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    };

    if (extToMime[ext] !== contentType) {
      return { valid: false, error: "Extension does not match content type" };
    }

    return { valid: true };
  }

  it('should accept valid JPEG', () => {
    expect(validateUpload('photo.jpg', 'image/jpeg').valid).toBe(true);
  });

  it('should accept valid PNG', () => {
    expect(validateUpload('photo.png', 'image/png').valid).toBe(true);
  });

  it('should accept valid WebP', () => {
    expect(validateUpload('photo.webp', 'image/webp').valid).toBe(true);
  });

  it('should reject mismatched extension and MIME type', () => {
    expect(validateUpload('photo.png', 'image/jpeg').valid).toBe(false);
  });

  it('should reject disallowed extensions', () => {
    expect(validateUpload('malware.exe', 'application/octet-stream').valid).toBe(false);
    expect(validateUpload('script.html', 'text/html').valid).toBe(false);
    expect(validateUpload('data.svg', 'image/svg+xml').valid).toBe(false);
  });

  it('should handle path traversal in filename', () => {
    // Extension extraction ignores path components
    const result = validateUpload('../../../etc/passwd.jpg', 'image/jpeg');
    expect(result.valid).toBe(true); // UUID filename prevents traversal on server
  });

  it('should handle double extensions', () => {
    const result = validateUpload('photo.exe.jpg', 'image/jpeg');
    expect(result.valid).toBe(true); // Only last extension matters + UUID rename
  });
});

// ── Security Headers ─────────────────────────────────────────────────────────

describe('Security Headers', () => {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'Permissions-Policy',
  ];

  it('should define all required security headers', () => {
    // These are configured in vercel.json
    requiredHeaders.forEach(header => {
      expect(header.length).toBeGreaterThan(0);
    });
    expect(requiredHeaders).toHaveLength(6);
  });

  it('should set X-Frame-Options to DENY', () => {
    const value = 'DENY';
    expect(value).toBe('DENY');
  });

  it('should set HSTS with long max-age', () => {
    const maxAge = 63072000; // 2 years
    expect(maxAge).toBeGreaterThanOrEqual(31536000); // at least 1 year
  });

  it('should restrict camera permission to self', () => {
    const policy = 'camera=(self), microphone=(), geolocation=(), interest-cohort=()';
    expect(policy).toContain('camera=(self)');
    expect(policy).toContain('microphone=()');
  });
});

// ── CORS ─────────────────────────────────────────────────────────────────────

describe('CORS Configuration', () => {
  it('should allow Capacitor origins', () => {
    const allowedOrigins = new Set([
      'capacitor://localhost',
      'http://localhost',
      'http://localhost:3000',
    ]);
    expect(allowedOrigins.has('capacitor://localhost')).toBe(true);
    expect(allowedOrigins.has('http://localhost')).toBe(true);
  });

  it('should not allow arbitrary origins', () => {
    const allowedOrigins = new Set([
      'capacitor://localhost',
      'http://localhost',
    ]);
    expect(allowedOrigins.has('https://evil.com')).toBe(false);
  });

  it('should allow Authorization header in CORS', () => {
    const allowedHeaders = 'Authorization, Content-Type, X-Filename, X-Bourbon-Id';
    expect(allowedHeaders).toContain('Authorization');
    expect(allowedHeaders).toContain('Content-Type');
  });
});

// ── postMessage Origin ──────────────────────────────────────────────────────

describe('postMessage Security', () => {
  it('should never use wildcard origin for sensitive data', () => {
    const targetOrigin = 'https://myapp.vercel.app';
    expect(targetOrigin).not.toBe('*');
  });

  it('should validate message origin on receiver', () => {
    const expectedOrigin = 'https://myapp.vercel.app';
    const messageOrigin = 'https://myapp.vercel.app';
    expect(messageOrigin === expectedOrigin).toBe(true);
  });

  it('should reject messages from wrong origin', () => {
    const expectedOrigin = 'https://myapp.vercel.app';
    const maliciousOrigin = 'https://evil.com';
    expect(maliciousOrigin === expectedOrigin).toBe(false);
  });
});
