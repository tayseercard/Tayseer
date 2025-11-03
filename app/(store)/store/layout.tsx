'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Search,
  LayoutDashboard,
  Gift,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  Menu,
  X,
} from 'lucide-react';

/* ---------------------- NavItem ---------------------- */
function NavItem({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + '/');
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
        active
          ? 'bg-white/60 text-gray-900 shadow-sm backdrop-blur'
          : 'text-gray-700 hover:bg-white/30 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

/* ---------------------- Layout ---------------------- */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  if (pathname?.startsWith('/store/auth')) return <>{children}</>;

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
    /* ---------------------- Logout ---------------------- */

 async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }
  /* ---------------------- Auth check ---------------------- */
 useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      // 🔹 Get the current session
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

      if (sessionErr) console.error('Session error:', sessionErr.message);

      if (!session) {
        if (mounted) router.replace('/auth/login?redirectTo=/store');
        return;
      }

      // 🔹 Check role
      const { data: roleRow, error: roleErr } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleErr) {
        console.error('Role fetch error:', roleErr.message);
        await supabase.auth.signOut();
        if (mounted) router.replace('/auth/login?redirectTo=/store');
        return;
      }

      const allowedRoles = ['store_owner', 'store', 'manager', 'cashier'];
      if (!roleRow || !allowedRoles.includes(roleRow.role)) {
        console.warn('Unauthorized role:', roleRow?.role);
        await supabase.auth.signOut();
        if (mounted) router.replace('/auth/login?redirectTo=/store');
        return;
      }

      // 🔹 Fetch store info
      const { data: store, error: storeErr } = await supabase
        .from('stores')
        .select('name')
        .eq('owner_user_id', session.user.id)
        .maybeSingle();

      if (storeErr) console.error('Store fetch error:', storeErr.message);

      if (mounted) {
        setEmail(session.user.email ?? null);
        setStoreName(store?.name ?? null);
        setChecking(false);
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      if (mounted) router.replace('/auth/login?redirectTo=/store');
    }
  })();

  return () => {
    mounted = false;
  };
}, [router, supabase]);


  if (checking) {
    return (
      <main className="grid min-h-dvh place-items-center bg-gray-50 text-gray-700">
        <div className="text-sm">Checking store session…</div>
      </main>
    );
  }

  /* ---------------------- UI ---------------------- */
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 overflow-hidden">
      {/* Header (top bar) */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-1.5 hover:bg-gray-100"
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
          </button>
          <div className="relative h-8 w-24">
            <Image alt="tayseer" src="/tayseercard.png" fill className="object-contain" />
          </div>
        </div>
        <div className="text-sm text-gray-600">{storeName ?? email}</div>
      </header>

      {/* Overlay sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] transform bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-xl transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="relative h-8 w-24">
            <Image alt="tayseer" src="/tayseercard.png" fill className="object-contain" />
          </div>
          <button onClick={() => setMenuOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="px-3 mt-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-700 outline-none placeholder:text-gray-500"
            />
          </div>

          <div className="text-[12px] uppercase tracking-wide text-gray-500 mb-2">
            Main Menu
          </div>
          <nav className="space-y-1">
            <NavItem href="/store/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMenuOpen(false)} />
            <NavItem href="/store/vouchers" icon={Gift} label="Vouchers" onClick={() => setMenuOpen(false)} />
            <NavItem href="/store/clients" icon={Users} label="Clients" onClick={() => setMenuOpen(false)} />
            <NavItem href="/store/settings" icon={Settings} label="Settings" onClick={() => setMenuOpen(false)} />
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 px-3 pb-4">
          <button
          onClick={handleLogout}
          className="text-xs text-gray-600 hover:underline"
        >
          Logout
        </button>
        </div>
      </aside>

      {/* Dimmed background when sidebar open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="relative z-10 p-4 md:p-6 transition-all duration-300">
        <div className="flex flex-col min-h-[85vh] overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/store">Main Menu</Link>
              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              <span className="font-medium text-gray-900">
                {pathname?.split('/').slice(2).join(' / ') || 'Dashboard'}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
