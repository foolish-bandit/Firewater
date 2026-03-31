/**
 * Centralized API client that handles JWT authentication.
 * All authenticated API calls should use these helpers.
 */

const TOKEN_KEY = "bs_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Build headers with auth token included */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Authenticated fetch wrapper */
export function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = authHeaders(
    init.headers
      ? Object.fromEntries(
          init.headers instanceof Headers
            ? init.headers.entries()
            : Array.isArray(init.headers)
              ? init.headers
              : Object.entries(init.headers as Record<string, string>)
        )
      : {}
  );
  return fetch(url, { ...init, headers });
}

/**
 * Authenticated fetch with offline queue support.
 * If the request fails due to network error, it gets queued
 * for replay when connectivity returns.
 */
export async function apiFetchWithQueue(
  url: string,
  init: RequestInit = {},
  description: string = "API request"
): Promise<Response> {
  const headers = authHeaders(
    init.headers
      ? Object.fromEntries(
          init.headers instanceof Headers
            ? init.headers.entries()
            : Array.isArray(init.headers)
              ? init.headers
              : Object.entries(init.headers as Record<string, string>)
        )
      : {}
  );

  try {
    const res = await fetch(url, { ...init, headers });
    return res;
  } catch (err) {
    // Network error — queue for later if it's a mutation
    if (init.method && init.method !== "GET") {
      const { enqueue } = await import("./lib/offlineQueue");
      await enqueue({
        url,
        method: init.method || "POST",
        headers,
        body: typeof init.body === "string" ? init.body : null,
        description,
      });
    }
    throw err;
  }
}
