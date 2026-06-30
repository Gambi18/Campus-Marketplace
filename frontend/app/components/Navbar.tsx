"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import Button from './Button';
import NotificationCenter from './NotificationCenter';
import { useEffect, useState, useRef } from 'react';
import { Menu, X, LogOut, User, ShoppingBag, DollarSign, ListOrdered, MessageSquare } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { deleteCookie } from '@/utils/cookie';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  // Closes the desktop dropdown menu cleanly when clicking anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    deleteCookie('token');
    deleteCookie('refresh_token');
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    router.push("/");
  };

  const handleProtectedAction = (e: React.MouseEvent, _targetHref: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setMobileMenuOpen(false);
      router.push("/login");
    }
  };

  // Clean, high-level desktop core navigation links
  const desktopCoreLinks = [
    { label: "Browse", href: "/", isProtected: false },
    { label: "Messages", href: "/conversations", isProtected: true, badge: unreadMessages },
  ];

  // User-specific links hidden inside the dropdown menu (and reuseable on mobile!)
  const profileDropdownLinks = [
    { label: "Profile", href: "/profile", icon: <User className="w-4 h-4" /> },
    { label: "My Listings", href: "/mylistings", icon: <ListOrdered className="w-4 h-4" /> },
    { label: "Purchases", href: "/purchases", icon: <ShoppingBag className="w-4 h-4" /> },
    { label: "Sales", href: "/sales", icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <>
      <nav className="w-full h-16 bg-white border-b border-gray-100 px-4 sm:px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Logo />

            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {desktopCoreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => link.isProtected && handleProtectedAction(e, link.href)}
                  className={`h-16 flex items-center transition-colors relative ${
                    pathname === link.href
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
            <Button variant="primary" size="md" className="hidden sm:inline-flex" onClick={() => router.push("/sell")}>
              <span className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">Sell Item</span>
              </span>
            </Button>

            {isLoggedIn && <NotificationCenter />}

            {!isLoggedIn ? (
              <Link
                href="/login"
                aria-label="Log in"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 cursor-pointer overflow-hidden hover:ring-2 hover:ring-offset-2 hover:ring-brand-primary transition-all duration-150 flex-shrink-0"
              >
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-text-muted hover:text-brand-primary transition-colors">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </Link>
            ) : (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-9 h-9 rounded-full border border-gray-200 cursor-pointer overflow-hidden hover:ring-2 hover:ring-offset-2 hover:ring-brand-primary transition-all duration-150 flex items-center justify-center bg-slate-100 text-gray-600 hover:text-brand-primary"
                  aria-haspopup="true"
                  aria-expanded={profileDropdownOpen}
                >
                  <User className="w-5 h-5" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                    {profileDropdownLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                          pathname === link.href ? "text-brand-primary bg-blue-50/50" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-gray-400">{link.icon}</div>
                        {link.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Modernized Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden fixed inset-0 top-16 bg-white border-b border-gray-100 z-30 overflow-y-auto">
          <div className="flex flex-col p-4 space-y-5">
            
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-4 mb-2">
                Discover
              </div>
              <div className="flex flex-col space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${
                    pathname === "/" ? "bg-blue-50 text-brand-primary" : "text-text-muted hover:bg-gray-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  Browse
                </Link>
                
                <Link
                  href="/conversations"
                  onClick={(e) => handleProtectedAction(e, "/conversations")}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between ${
                    pathname === "/conversations" ? "bg-blue-50 text-brand-primary" : "text-text-muted hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <span>Messages</span>
                  </div>
                  {unreadMessages > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {isLoggedIn && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-4 mb-2">
                  Your Account
                </div>
                <div className="flex flex-col space-y-1">
                  {profileDropdownLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        handleProtectedAction(e, link.href);
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${
                        pathname === link.href ? "bg-blue-50 text-brand-primary" : "text-text-muted hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-gray-400">{link.icon}</div>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 flex flex-col space-y-2">
              <Link
                href="/sell"
                onClick={(e) => handleProtectedAction(e, "/sell")}
                className="px-4 py-3 rounded-lg font-semibold bg-blue-50 text-brand-primary hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Sell an Item
              </Link>

              {!isLoggedIn ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
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
        </div>
      )}
    </>
  );
}