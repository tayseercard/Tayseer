import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PATHS = ['/admin', '/store', '/superadmin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();

  const cookies =
    typeof (req.cookies as any).then === 'function'
      ? await req.cookies
      : req.cookies;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // 🔹 Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // ✅ If not logged in → redirect to login
  if (!user && PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ If logged in, check their role
  if (user) {
    const { data: roles } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id);

    const roleList = roles?.map((r) => r.role) || [];
    const isSuperadmin = roleList.includes('superadmin');
    const isAdmin = roleList.includes('admin');
    const isStore =
      roleList.includes('store_owner') ||
      roleList.includes('manager') ||
      roleList.includes('cashier');

    // 🧱 Protect /superadmin routes
    if (url.pathname.startsWith('/superadmin') && !isSuperadmin) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 🧱 Protect /admin routes
    if (url.pathname.startsWith('/admin') && !(isAdmin || isSuperadmin)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 🧱 Protect /store routes
    if (url.pathname.startsWith('/store') && !(isStore || isSuperadmin)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/superadmin/:path*', '/admin/:path*', '/store/:path*'],
};
