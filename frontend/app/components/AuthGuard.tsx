'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Client-side auth guard — replaces the former Edge middleware.ts.
 *
 * Next.js 16's Edge middleware bundler pulls `ua-parser-js` in through
 * `next/server` and throws `__dirname is not defined`, which makes the whole
 * site return 404 on Vercel. We reproduce the same gate here on the client
 * instead. The JWT lives in localStorage (mirrored to a `token` cookie at
 * login), and the Go backend independently enforces auth on every protected
 * API call, so this is purely a UX redirect.
 */
const PROTECTED_PREFIXES = [
  '/sell',
  '/mylistings',
  '/purchases',
  '/sales',
  '/profile',
  '/conversations',
  '/notifications',
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (isProtected && !localStorage.getItem('token')) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
