/**
 * Centralized API client that uses Clerk session tokens for authentication.
 *
 * Clerk manages token lifecycle (issuance, refresh, expiry). The client
 * obtains a fresh token via a getter injected from the React layer.
 */

let clerkGetToken: (() => Promise<string | null>) | null = null;

/**
 * Inject Clerk's getToken function so apiFetch can attach session tokens.
 * Called once from useAuth when the Clerk provider is ready.
 */
export function setClerkTokenGetter(getter: () => Promise<string | null>): void {
  clerkGetToken = getter;
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
 * Authenticated fetch wrapper.
 * Automatically attaches the Clerk session token to requests.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = resolveHeaders(init);

  if (clerkGetToken) {
    const token = await clerkGetToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

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
  try {
    return await apiFetch(url, init);
  } catch (err) {
    // Network error — queue for later if it's a mutation
    if (init.method && init.method !== "GET") {
      const headers = resolveHeaders(init);
      if (clerkGetToken) {
        const token = await clerkGetToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
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
