// API client utilities
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Default per-request timeout so a hung request can't leave the UI spinning forever.
const DEFAULT_TIMEOUT_MS = 15000;

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  // Try to get token from localStorage
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
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
    if (response.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Avoid a redirect loop when an auth-protected call on the login page 401s.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchAPI<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
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
