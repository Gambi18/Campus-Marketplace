export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface SetCookieOptions {
  /** Lifetime in seconds. Defaults to 7 days. */
  maxAge?: number;
  path?: string;
}

/**
 * Persist a cookie so server-side Next.js middleware can read it (middleware
 * cannot see localStorage). Mirrors the JWT we also keep in localStorage.
 */
export function setCookie(name: string, value: string, options: SetCookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  const { maxAge = 60 * 60 * 24 * 7, path = '/' } = options;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; SameSite=Strict`;
}

export function deleteCookie(name: string, path = '/', domain?: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${path}; domain=${domain || ''}; max-age=0; SameSite=Strict`;
}
