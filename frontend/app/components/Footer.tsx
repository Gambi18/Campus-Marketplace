"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const pathname = usePathname();
  if (pathname !== '/') return null;

  const currentYear = new Date().getFullYear();

  const marketplaceLinks = [
    { label: 'Textbooks', href: '/' },
    { label: 'Electronics', href: '/' },
    { label: 'Furniture', href: '/' },
    { label: 'Browse Items', href: '/' },
  ];

  const resourceLinks = [
    { label: 'Safety Guide', href: '/' },
    { label: 'Sell an Item', href: '/sell' },
    { label: 'Price Checker', href: '/' },
    { label: 'Community Blog', href: '/' },
  ];

  const supportLinks = [
    { label: 'Help Center', href: '/' },
    { label: 'Contact Support', href: '/' },
    { label: 'Trust & Safety', href: '/' },
    { label: 'Terms of Service', href: '/' },
  ];

  return (
    <footer className="w-full bg-brand-tertiary text-text-main border-t border-gray-200">

      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

        <div className="md:col-span-4 flex flex-col space-y-4">
          <Logo />
          <p className="text-sm text-text-muted leading-relaxed max-w-sm">
            A peer-to-peer marketplace for university students—everyone can list items and shop listings from others on campus.
          </p>

          <div className="flex items-center space-x-4 pt-2 text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-pointer hover:text-brand-primary transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-pointer hover:text-brand-primary transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-2.25a1.125 1.125 0 0 0-1.125 1.125V18.75m9-7.5H4.5L3 4.5h18l-1.5 6.75Z" />
            </svg>
          </div>
        </div>
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div className="flex flex-col space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-neutral">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm">
              {marketplaceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-text-muted hover:text-brand-primary transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          <div className="flex flex-col space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-neutral">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-text-muted hover:text-brand-primary transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col space-y-3.5 col-span-2 sm:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-neutral">
              Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-text-muted hover:text-brand-primary transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
      <div className="border-t border-gray-200/60 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div>
            &copy; {currentYear} CampusMarket. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
