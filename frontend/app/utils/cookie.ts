export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string, path = '/', domain?: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${path}; domain=${domain || ''}; max-age=0; SameSite=Strict`;
}
