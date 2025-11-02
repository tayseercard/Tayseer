import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // 🧩 Allow public and error routes
  if (
    pathname.startsWith('/403') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return res
  }

  const isAuthPage =
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname === '/login'

  // 🧱 If user not logged in → only /auth allowed
  if (!session) {
    if (!isAuthPage) {
      url.pathname = '/auth/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return res
  }

  // ✅ Logged in: extract role
  const role = session.user.user_metadata?.role

  if (!role) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  // 🚀 If user visits a public/auth page but is already logged in
  // redirect them automatically to their correct dashboard
  if (isAuthPage) {
    if (role === 'superadmin') {
      url.pathname = '/superadmin'
    } else if (role === 'admin') {
      url.pathname = '/admin'
    } else if (['store_owner', 'manager', 'cashier'].includes(role)) {
      url.pathname = '/store'
    } else {
      url.pathname = '/403'
    }
    return NextResponse.redirect(url)
  }

  // 🔐 Role-based route protection
  if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && !['admin', 'superadmin'].includes(role)) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/store') && !['store_owner', 'manager', 'cashier'].includes(role)) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  // ✅ All good — allow page to render
  return res
}

export const config = {
  matcher: ['/', '/auth/:path*', '/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}

