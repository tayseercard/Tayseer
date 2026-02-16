'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Gift,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Sidebar({ storeName, email }: { storeName?: string | null; email?: string | null }) {
  const [open, setOpen] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  const links = [
    { href: '/store/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/store/cards', label: 'Gift Cards', icon: Gift },
    { href: '/store/clients', label: 'Clients', icon: Users },
    { href: '/store/settings', label: 'Settings', icon: Settings },
  ];

  const logout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    await supabase.auth.signOut();
    router.refresh();
    router.replace('/auth/login?for=store');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-white/90 p-2 shadow md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed md:static z-40 flex h-full flex-col bg-white/90 border-r border-gray-200 transition-all duration-300
        ${open ? 'w-64 translate-x-0' : '-translate-x-full md:w-20 md:translate-x-0'}`}
      >
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="relative h-10 w-28">
            <Image alt="tayseer" src="/tayseercard.png" fill className="object-contain" />
          </div>
        </div>

        {open && (
          <div className="relative mx-4 mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-700 outline-none placeholder:text-gray-500"
            />
          </div>
        )}

        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-emerald-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {open && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 px-3 py-3">
          {open && (
            <div className="mb-2 text-sm font-medium text-gray-800 truncate">
              {storeName || email}
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
