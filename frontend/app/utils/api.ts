// API client utilities
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
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
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function putAPI<T>(endpoint: string, data: unknown): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function patchAPI<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function deleteAPI<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}
