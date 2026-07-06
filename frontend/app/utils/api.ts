// API client utilities
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Default per-request timeout so a hung request can't leave the UI spinning forever.
const DEFAULT_TIMEOUT_MS = 15000;

/** Single WebSocket URL strategy: derive ws(s):// from the API URL. */
export function getWsUrl(): string {
  return `${API_URL.replace('http', 'ws')}/api/v1/ws`;
}

export interface ApiAuthOptions {
  /** localStorage key holding the bearer token. Defaults to the student 'token'. */
  tokenKey?: string;
  /**
   * When true (default), a 401 on a non-auth endpoint clears the token and
   * redirects to /login. Admin calls and passive access probes disable this.
   */
  redirectOnUnauthorized?: boolean;
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  auth: ApiAuthOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const tokenKey = auth.tokenKey ?? 'token';
  const redirectOnUnauthorized = auth.redirectOnUnauthorized ?? true;

  // Try to get token from localStorage
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem(tokenKey);
  }
 const headers: Record<string, string> = {
    ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  // Abort the request after a timeout unless the caller supplied their own signal.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options?.signal ?? controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out, please try again');
    }
    throw err instanceof Error ? err : new Error('Network error');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // A 401 from the login/register endpoints means bad credentials, not an
    // expired session — let the backend's real message ("invalid email or
    // password") through instead of hijacking it with a session-expired flow.
    const isAuthEndpoint = endpoint.startsWith('/api/v1/auth/') || endpoint.startsWith('/api/v1/admin/auth/');
    if (response.status === 401 && redirectOnUnauthorized && !isAuthEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem(tokenKey);
      // Avoid a redirect loop when an auth-protected call on the login page 401s.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API call failed: ${response.statusText}`);
  }

  // Tolerate empty 2xx bodies (e.g. some admin mutations) instead of throwing
  // on JSON.parse of an empty string.
  const text = await response.text();
  return (text ? JSON.parse(text) : ({} as T)) as T;
}

// `init` lets server components pass Next fetch caching hints
// (e.g. `{ next: { revalidate: 30 } }`) through to the underlying fetch.
export async function fetchAPI<T>(endpoint: string, init?: RequestInit): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET', ...init });
}

export async function postAPI<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: data instanceof FormData ? data : data? JSON.stringify(data) : undefined,
  });
}

export async function putAPI<T>(endpoint: string, data: unknown): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export async function patchAPI<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PATCH',
    body:data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
  });
}

export async function deleteAPI<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}
