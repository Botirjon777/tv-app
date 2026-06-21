'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Hotel, Wrench, Image, Tv,
  Settings, LogOut, MonitorPlay, BellRing,
} from 'lucide-react';
import { clearToken } from '@/lib/auth';
import { clsx } from 'clsx';

const NAV = [
  { href: '/dashboard',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/requests', label: 'Requests',   icon: BellRing },
  { href: '/dashboard/rooms',    label: 'Rooms',      icon: Hotel },
  { href: '/dashboard/services', label: 'Services',   icon: Wrench },
  { href: '/dashboard/content',  label: 'Content',    icon: Image },
  { href: '/dashboard/devices',  label: 'Devices',    icon: Tv },
  { href: '/dashboard/settings', label: 'Settings',   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-text shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <MonitorPlay size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Hotel TV</p>
          <p className="text-sidebar-muted text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-700 text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium
                     text-sidebar-muted hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
