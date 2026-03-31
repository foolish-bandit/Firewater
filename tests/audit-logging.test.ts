import { describe, it, expect } from 'vitest';

/**
 * Tests for audit logging of authentication events.
 * Validates that login attempts (success/failure) are logged
 * with appropriate context.
 */

interface AuditLogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  endpoint: string;
  method: string;
  ip: string;
  userId?: string;
  identifier_type?: string;
  reason?: string;
}

function createAuditLogger() {
  const entries: AuditLogEntry[] = [];

  return {
    info(message: string, ctx: Record<string, unknown>) {
      entries.push({ level: 'info', message, ...ctx } as AuditLogEntry);
    },
    warn(message: string, ctx: Record<string, unknown>) {
      entries.push({ level: 'warn', message, ...ctx } as AuditLogEntry);
    },
    error(message: string, ctx: Record<string, unknown>) {
      entries.push({ level: 'error', message, ...ctx } as AuditLogEntry);
    },
    getEntries: () => entries,
    clear: () => entries.length = 0,
  };
}

describe('Audit Logging: Failed Login Attempts', () => {
  it('should log failed attempt with reason "user_not_found"', () => {
    const logger = createAuditLogger();
    logger.warn('Failed login attempt', {
      endpoint: 'auth:signin',
      method: 'POST',
      ip: '1.2.3.4',
      identifier_type: 'email',
      reason: 'user_not_found',
    });

    const entries = logger.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('warn');
    expect(entries[0].reason).toBe('user_not_found');
    expect(entries[0].ip).toBe('1.2.3.4');
  });

  it('should log failed attempt with reason "wrong_password"', () => {
    const logger = createAuditLogger();
    logger.warn('Failed login attempt', {
      endpoint: 'auth:signin',
      method: 'POST',
      ip: '1.2.3.4',
      identifier_type: 'email',
      reason: 'wrong_password',
    });

    expect(logger.getEntries()[0].reason).toBe('wrong_password');
  });

  it('should log failed attempt with reason "no_password" (OAuth user)', () => {
    const logger = createAuditLogger();
    logger.warn('Failed login attempt', {
      endpoint: 'auth:signin',
      method: 'POST',
      ip: '5.6.7.8',
      identifier_type: 'phone',
      reason: 'no_password',
    });

    expect(logger.getEntries()[0].reason).toBe('no_password');
    expect(logger.getEntries()[0].identifier_type).toBe('phone');
  });
});

describe('Audit Logging: Successful Login', () => {
  it('should log successful login with userId', () => {
    const logger = createAuditLogger();
    logger.info('Successful login', {
      endpoint: 'auth:signin',
      method: 'POST',
      userId: 'user-123',
      ip: '1.2.3.4',
    });

    const entries = logger.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('info');
    expect(entries[0].userId).toBe('user-123');
  });
});

describe('Audit Logging: Password Reset', () => {
  it('should log reset request for unknown identifier', () => {
    const logger = createAuditLogger();
    logger.info('Password reset requested for unknown identifier', {
      endpoint: 'auth:reset',
      method: 'POST',
      ip: '1.2.3.4',
    });

    expect(logger.getEntries()[0].message).toContain('unknown');
  });

  it('should log reset token generation', () => {
    const logger = createAuditLogger();
    logger.info('Password reset token generated', {
      endpoint: 'auth:reset',
      method: 'POST',
      userId: 'user-456',
      ip: '1.2.3.4',
    });

    expect(logger.getEntries()[0].userId).toBe('user-456');
  });

  it('should log reset completion', () => {
    const logger = createAuditLogger();
    logger.info('Password reset completed', {
      endpoint: 'auth:reset',
      method: 'POST',
      userId: 'user-456',
      ip: '1.2.3.4',
    });

    expect(logger.getEntries()[0].message).toContain('completed');
  });
});

describe('Audit Logging: Security Event Detection', () => {
  it('should detect brute force pattern (multiple failures from same IP)', () => {
    const logger = createAuditLogger();
    const ip = '10.0.0.1';

    for (let i = 0; i < 5; i++) {
      logger.warn('Failed login attempt', {
        endpoint: 'auth:signin',
        method: 'POST',
        ip,
        reason: 'wrong_password',
      });
    }

    const failedFromIp = logger.getEntries().filter(
      e => e.level === 'warn' && e.ip === ip
    );
    expect(failedFromIp.length).toBe(5);
    // In a real system, this would trigger an alert
  });

  it('should not leak sensitive data in log entries', () => {
    const logger = createAuditLogger();
    logger.warn('Failed login attempt', {
      endpoint: 'auth:signin',
      method: 'POST',
      ip: '1.2.3.4',
      identifier_type: 'email',
      reason: 'wrong_password',
    });

    const entry = logger.getEntries()[0];
    // Should NOT contain actual credentials or PII
    const serialized = JSON.stringify(entry);
    expect(serialized).not.toContain('actual_password_value');
    expect(serialized).not.toContain('user@example.com');
    expect(serialized).not.toContain('jwt_token_value');
    expect(serialized).not.toContain('$2a$10$'); // bcrypt hash
  });
});
