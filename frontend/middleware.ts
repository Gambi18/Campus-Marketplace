import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Central auth guard for protected student routes.
 *
 * The JWT lives in localStorage (which middleware cannot read), so the login
 * flow ALSO mirrors it into a `token` cookie. Here we only check for the
 * cookie's presence and bounce unauthenticated users to /login, preserving
 * their intended destination via the `from` query param.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Only run on protected routes (and their sub-paths).
export const config = {
  matcher: [
    '/sell/:path*',
    '/mylistings/:path*',
    '/purchases/:path*',
    '/sales/:path*',
    '/profile/:path*',
    '/conversations/:path*',
    '/notifications/:path*',
  ],
};
