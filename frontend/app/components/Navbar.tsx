"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import Button from './Button';
import NotificationCenter from './NotificationCenter';
import { useEffect, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { fetchAPI } from '../utils/api';


export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnread = async () => {
      try {
        const res = await fetchAPI<{ unread_count: number }>('/api/v1/unread-count');
        setUnreadMessages(res.unread_count || 0);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  // const navLinks: { label: string; href: string; badge?: number }[] = [
  //   { label: "Browse", href: "/" },
  //   ...(isLoggedIn
  //     ? [
  //         { label: "My Listings", href: "/mylistings" },
  //         { label: "Messages", href: "/conversations", badge: unreadMessages },
  //         { label: "Purchases", href: "/purchases" },
  //         { label: "Sales", href: "/sales" },
  //         { label: "Profile", href: "/profile" },
  //       ]
  //     : []),
  // ];
  const handleProtectedAction = (e: React.MouseEvent, _targetHref: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setMobileMenuOpen(false);
      router.push("/login");
    }
  };

  const navLinks: { label: string; href: string; isProtected: boolean; badge?: number }[] = [
    { label: "Browse", href: "/", isProtected: false },
    { label: "My Listings", href: "/mylistings", isProtected: true },
    { label: "Messages", href: "/conversations", isProtected: true, badge: unreadMessages },
    { label: "Purchases", href: "/purchases", isProtected: true },
    { label: "Sales", href: "/sales", isProtected: true },
    { label: "Profile", href: "/profile", isProtected: true },
  ];

  return (
    <>
      <nav className="w-full h-16 bg-white border-b border-gray-100 px-4 sm:px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Logo />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => link.isProtected && handleProtectedAction(e, link.href)}
                  className={`h-16 flex items-center transition-colors relative ${pathname === link.href
                      ? "text-brand-primary font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-primary"
                      : "text-text-muted hover:text-brand-neutral"
                    }`}
                >
                  {link.label}
                  {link.badge && link.badge > 0 ? (
                    <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Sell Item Button - hide on very small screens */}
            <Link href="/sell" className="hidden sm:block" onClick={(e) => handleProtectedAction(e, "/sell")}>
              <Button variant="primary" size="md">
                <span className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="hidden sm:inline">Sell Item</span>
                </span>
              </Button>
            </Link>

            {/* Notifications */}
            {isLoggedIn && <NotificationCenter />}

            {/* Profile / Auth Section */}
            {!isLoggedIn ? (

              <Link
                href="/register"
                aria-label="Create an account"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 cursor-pointer overflow-hidden hover:ring-2 hover:ring-offset-2 hover:ring-brand-primary transition-all duration-150 flex-shrink-0"
              >
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-text-muted hover:text-brand-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
              </Link>
            ) : (
              // Logged in - show mobile menu toggle and profile icon
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </Button>
            )}

            {/* Desktop Logout Button */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}

            {/* Mobile Menu Button - show when not logged in */}
            {!isLoggedIn && (
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden fixed inset-0 top-16 bg-white border-b border-gray-100 z-30">
          <div className="flex flex-col p-4 space-y-2">
            {/* Mobile Nav Links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (link.isProtected) {
                    handleProtectedAction(e, link.href);
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${pathname === link.href
                    ? "bg-blue-50 text-brand-primary"
                    : "text-text-muted hover:bg-gray-50 hover:text-brand-neutral"
                  }`}
              >
                {link.label}
                {link.badge && link.badge > 0 ? (
                  <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                ) : null}
              </Link>
            ))}

            {/* Mobile Sell Button */}
            <Link
              href="/sell"
              onClick={(e) => handleProtectedAction(e, "/sell")}
              className="px-4 py-3 rounded-lg font-medium text-brand-primary hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Sell Item
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-100 my-2" />

            {/* Mobile Auth Section */}
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg font-medium text-brand-primary hover:bg-blue-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg font-medium bg-brand-primary text-white hover:bg-blue-700 transition-colors text-center"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 justify-center"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}