/**
 * Centralized API client that handles JWT authentication with refresh token support.
 *
 * Access tokens expire after 1 hour. When a 401 is received, the client
 * automatically attempts to refresh using the HttpOnly cookie refresh token.
 * On native (Capacitor), the refresh token is stored locally since HttpOnly
 * cookies don't work in webviews.
 */

const TOKEN_KEY = "bs_token";
const REFRESH_KEY = "bs_refresh_token"; // Only used on Capacitor native

let refreshPromise: Promise<string | null> | null = null;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Store refresh token locally (Capacitor native only) */
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
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

/**
 * Attempt to refresh the access token using the refresh token.
 * Deduplicates concurrent refresh attempts.
 */
async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate: if a refresh is already in progress, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const body: Record<string, string> = {};
      const localRefresh = getRefreshToken();
      if (localRefresh) {
        // Capacitor native: send refresh token in body
        body.refreshToken = localRefresh;
      }
      // Web: refresh token is in HttpOnly cookie, sent automatically

      const res = await fetch("/api/auth/session?action=refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // include cookies
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        clearToken();
        return null;
      }

      const data = await res.json();
      setToken(data.accessToken);

      // If Capacitor returned a new refresh token, store it
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }

      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function resolveHeaders(init: RequestInit): Record<string, string> {
  if (!init.headers) return {};
  if (init.headers instanceof Headers) {
    return Object.fromEntries(init.headers.entries());
  }
  if (Array.isArray(init.headers)) {
    return Object.fromEntries(init.headers);
  }
  return init.headers as Record<string, string>;
}

/**
 * Authenticated fetch wrapper with automatic token refresh.
 *
 * If the request returns 401, attempts to refresh the access token
 * and retry the request once.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = authHeaders(resolveHeaders(init));
  const res = await fetch(url, { ...init, headers, credentials: "include" });

  // If 401 and we have a token, try refreshing
  if (res.status === 401 && getToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry with new token
      const retryHeaders = { ...resolveHeaders(init), Authorization: `Bearer ${newToken}` };
      return fetch(url, { ...init, headers: retryHeaders, credentials: "include" });
    }
  }

  return res;
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
  try {
    return await apiFetch(url, init);
  } catch (err) {
    // Network error — queue for later if it's a mutation
    if (init.method && init.method !== "GET") {
      const headers = authHeaders(resolveHeaders(init));
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
