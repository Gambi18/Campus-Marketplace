import { apiCall } from './api';

const ADMIN_TOKEN_KEY = 'admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // Reuse the shared client's token/header/error handling, but key off the
  // admin token and never redirect to the student /login on a 401.
  return apiCall<T>(endpoint, options, {
    tokenKey: ADMIN_TOKEN_KEY,
    redirectOnUnauthorized: false,
  });
}

export async function adminLogin(email: string, password: string) {
  const data = await adminFetch<{ token: string }>('/api/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAdminToken(data.token);
  return data;
}
