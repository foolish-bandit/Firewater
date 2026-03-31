/**
 * Structured error logging for API endpoints.
 *
 * Provides consistent log formatting with context, making it easier to
 * search and filter in Vercel's log viewer or any log aggregation tool.
 *
 * To upgrade to a full monitoring service:
 * 1. Install Sentry: npm install @sentry/node
 * 2. Initialize in each API handler or create a wrapper
 * 3. Replace logger.error() calls with Sentry.captureException()
 */

export interface LogContext {
  /** Which API endpoint/scope */
  endpoint: string;
  /** HTTP method */
  method?: string;
  /** Authenticated user ID (if available) */
  userId?: string | null;
  /** Client IP */
  ip?: string;
  /** Additional key-value metadata */
  [key: string]: unknown;
}

function formatContext(ctx: LogContext): string {
  const parts: string[] = [];
  if (ctx.method) parts.push(`method=${ctx.method}`);
  parts.push(`endpoint=${ctx.endpoint}`);
  if (ctx.userId) parts.push(`userId=${ctx.userId}`);
  if (ctx.ip) parts.push(`ip=${ctx.ip}`);

  // Include any extra fields
  for (const [key, value] of Object.entries(ctx)) {
    if (['endpoint', 'method', 'userId', 'ip'].includes(key)) continue;
    if (value !== undefined && value !== null) {
      parts.push(`${key}=${JSON.stringify(value)}`);
    }
  }
  return parts.join(' ');
}

export const logger = {
  info(message: string, ctx: LogContext) {
    console.log(`[INFO] ${message} | ${formatContext(ctx)}`);
  },

  warn(message: string, ctx: LogContext) {
    console.warn(`[WARN] ${message} | ${formatContext(ctx)}`);
  },

  error(message: string, error: unknown, ctx: LogContext) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(`[ERROR] ${message} | ${formatContext(ctx)} | error=${errMsg}`);
    if (stack) {
      console.error(stack);
    }
  },
};

/** Extract client IP from request headers */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].split(",")[0].trim();
  return "unknown";
}
