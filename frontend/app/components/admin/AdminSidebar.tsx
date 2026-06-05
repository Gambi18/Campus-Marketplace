'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderTree, Flag, Users } from 'lucide-react';
import { clearAdminToken } from '../../utils/adminApi';

const NAV = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/reports', label: 'Reports & moderation', icon: Flag, planned: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-primary text-white flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <p className="font-bold text-brand-neutral text-sm">Admin Console</p>
            <p className="text-[11px] text-text-muted">Campus Marketplace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, planned }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-brand-primary text-white'
                : 'text-text-muted hover:bg-gray-50 hover:text-brand-neutral'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
              {planned && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                    }`}
                >
                  Soon
                </span>
              )}
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
}
