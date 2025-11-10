import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

// 🌍 Initialize next-intl middleware first
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'fr'
});

export async function middleware(req: NextRequest) {
  // 🔹 Run next-intl first → this ensures locale (/fr/, /en/, /ar/)
  const res = intlMiddleware(req);

  // 🔹 Then apply Supabase authentication logic
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // ✅ Skip auth for public pages
  if (
    pathname.includes('/auth') ||
    pathname.includes('/403') ||
    pathname === '/' ||
    pathname.startsWith('/api')
  )
    return res;

  // ✅ Protected paths (inside locale prefix)
  const isProtected =
    pathname.includes('/admin') ||
    pathname.includes('/superadmin') ||
    pathname.includes('/store');

  if (!isProtected) return res;

  // ❌ No session → redirect to login in the same language
  if (!session) {
    const locale = pathname.split('/')[1] || 'fr';
    url.pathname = `/${locale}/auth/login`;
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // ✅ Read role from JWT or DB
  let role = session.user.user_metadata?.role;
  if (!role) {
    const { data: roleData } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (roleData?.role) role = roleData.role;
  }

  if (!role) {
    url.pathname = '/403';
    return NextResponse.redirect(url);
  }

  // ✅ Role-based restriction
  if (pathname.includes('/superadmin') && role !== 'superadmin') {
    url.pathname = '/403';
    return NextResponse.redirect(url);
  }
  if (pathname.includes('/admin') && !['admin', 'superadmin'].includes(role)) {
    url.pathname = '/403';
    return NextResponse.redirect(url);
  }
  if (
    pathname.includes('/store') &&
    !['store_owner', 'manager', 'cashier'].includes(role)
  ) {
    url.pathname = '/403';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // ✅ Match locale-prefixed protected routes
  matcher: [
    '/admin/:path*',
    '/superadmin/:path*',
    '/store/:path*'
  ]
};
