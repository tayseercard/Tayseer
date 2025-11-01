import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Paths that must be protected
const PROTECTED_PATHS = ['/superadmin', '/admin', '/store'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();

  // ✅ Handle async cookies (Next.js 15+ compatibility)
  const cookies =
    typeof (req.cookies as any).then === 'function'
      ? await req.cookies
      : req.cookies;

  // ✅ Create Supabase client
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

  // ✅ Check current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PATHS.some((p) =>
    url.pathname.startsWith(p)
  );

  // 🔒 Not logged in → redirect to /auth/login
  if (isProtected && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ If logged in → check their roles
  if (isProtected && user) {
    const { data: roles, error } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id);

    if (error || !roles?.length) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const roleList = roles.map((r) => r.role);
    const isSuperadmin = roleList.includes('superadmin');
    const isAdmin = roleList.includes('admin');
    const isStore =
      roleList.includes('store_owner') ||
      roleList.includes('manager') ||
      roleList.includes('cashier');

    // 🧱 Protect superadmin pages
    if (url.pathname.startsWith('/superadmin') && !isSuperadmin) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 🧱 Protect admin pages
    if (url.pathname.startsWith('/admin') && !(isAdmin || isSuperadmin)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 🧱 Protect store pages
    if (url.pathname.startsWith('/store') && !(isStore || isSuperadmin)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  // ✅ Allow all else
  return res;
}

// ✅ Middleware triggers on these routes
export const config = {
  matcher: [
    '/superadmin/:path*',
    '/admin/:path*',
    '/store/:path*',
  ],
};
