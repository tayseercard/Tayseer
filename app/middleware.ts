import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PATHS = ['/admin', '/store'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();

  // ⚙️ FIX: handle async cookies in Next 15
  const cookies = (typeof (req.cookies as any).then === 'function')
    ? await req.cookies
    : req.cookies;

  // ✅ create Supabase client safely
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🧩 CASE 1: Protected pages (admin/store)
  if (PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))) {
    if (!user) {
      url.pathname = '/auth/login';
      url.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // 🔐 Check user role
    const { data: roleRow } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const role = roleRow?.role;

    if (url.pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/store', req.url));
    }

    if (url.pathname.startsWith('/store') && role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // 🧩 CASE 2: visiting login but already logged in
  if (url.pathname.startsWith('/auth/login')) {
    if (user) {
      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const role = roleRow?.role;
      const dest = role === 'admin' ? '/admin' : '/store';
      return NextResponse.redirect(new URL(dest, req.url));
    }

    return res;
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/store/:path*'],
};
