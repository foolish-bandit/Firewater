/**
 * Input sanitization utilities for user-generated content.
 * Prevents stored XSS by stripping dangerous HTML/script content.
 */

/** Strip HTML tags from a string. Preserves text content. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Sanitize user text input — strips HTML and trims. */
export function sanitizeText(input: unknown, maxLength: number = 5000): string {
  if (typeof input !== "string") return "";
  const cleaned = stripHtml(input).trim();
  return cleaned.slice(0, maxLength);
}

/** Sanitize a username/display name. */
export function sanitizeName(input: unknown, maxLength: number = 100): string {
  if (typeof input !== "string") return "";
  // Only strip HTML, keep unicode characters for international names
  return stripHtml(input).trim().slice(0, maxLength);
}

/** Validate and clamp a numeric rating. */
export function sanitizeRating(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n * 2) / 2)); // 0-5, 0.5 increments
}

/** Sanitize an array of string tags. */
export function sanitizeTags(input: unknown, maxTags: number = 20): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t): t is string => typeof t === "string")
    .map(t => stripHtml(t).trim().slice(0, 50))
    .filter(t => t.length > 0)
    .slice(0, maxTags);
}

/** Validate a UUID-like string (alphanumeric + hyphens). */
export function isValidId(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(input);
}

/** Sanitize bio text — allows more content but still strips scripts. */
export function sanitizeBio(input: unknown, maxLength: number = 500): string {
  return sanitizeText(input, maxLength);
}
