import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/admin', '/superadmin', '/store']

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // 🚫 Skip middleware for login, auth, and 403 pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/403')) {
    return NextResponse.next()
  }

  // ✅ Check if this is a protected path
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // ✅ Supabase cookies
  const hasAccess = req.cookies.has('sb-access-token')
  const hasRefresh = req.cookies.has('sb-refresh-token')

  const isReturningFromLogin = req.headers.get('referer')?.includes('/auth/login')

  if (!hasAccess && !hasRefresh && !isReturningFromLogin) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ✅ Check role
  const role = req.cookies.get('role')?.value

  if (!role) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  // 🔐 Role rules
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}
