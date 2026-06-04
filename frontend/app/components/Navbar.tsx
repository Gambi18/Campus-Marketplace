"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import Button from './Button';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Browse', href: '/' },
    { label: 'My Listings', href: '/mylistings' },
  ];

  return (
    <nav className="w-full h-16 bg-white border-b border-gray-100 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        
        <div className="flex items-center space-x-8">
          <Logo />
          
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`h-16 flex items-center transition-colors relative ${
                  pathname === link.href 
                    ? "text-brand-primary font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-primary" 
                    : "text-text-muted hover:text-brand-neutral"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="primary" size="md">
            <span className="flex items-center gap-1.5 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Sell Item
            </span>
          </Button>

          <div className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer overflow-hidden hover:ring-2 hover:ring-offset-2 hover:ring-brand-primary transition-all duration-150">
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-text-muted">
              <Link href="/register" className="w-full h-full flex items-center justify-center">
                JD
              </Link>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
}