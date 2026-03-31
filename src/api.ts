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
