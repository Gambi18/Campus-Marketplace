'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderTree, Flag, Users, CreditCard, X } from 'lucide-react';
import { clearAdminToken } from '../../utils/adminApi';

const NAV = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/payments', label: 'Payments (Escrow)', icon: CreditCard },
  { href: '/admin/reports', label: 'Reports & moderation', icon: Flag },
];

export default function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const sidebar = (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-primary text-white flex items-center justify-center text-sm font-bold">
              A
            </div>
            <div>
              <p className="font-bold text-brand-neutral text-sm">Admin Console</p>
              <p className="text-[11px] text-text-muted">Campus Marketplace</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-text-muted hover:text-brand-neutral">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-brand-primary text-white'
                : 'text-text-muted hover:bg-gray-50 hover:text-brand-neutral'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link
          href="/"
          className="block text-sm text-text-muted hover:text-brand-primary transition-colors"
        >
          ← Back to marketplace
        </Link>
        <button
          type="button"
          onClick={() => {
            clearAdminToken();
            window.location.href = '/admin/login';
          }}
          className="text-sm text-text-muted hover:text-red-600 transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <div className="fixed inset-y-0 left-0">{sidebar}</div>
        </div>
      )}
    </>
  );
}
