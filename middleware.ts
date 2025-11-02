import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🧱 Protected route groups
const PROTECTED = ['/admin', '/superadmin', '/store']

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // ✅ Only protect these routes
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // ✅ Supabase session cookies
  const hasAccess = req.cookies.has('sb-access-token')
  const hasRefresh = req.cookies.has('sb-refresh-token')

  // ⚠️ Prevent redirect loops after login
  const isReturningFromLogin = req.headers.get('referer')?.includes('/auth/login')

  if (!hasAccess && !hasRefresh && !isReturningFromLogin) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ✅ Retrieve role from cookie (set after login)
  const role = req.cookies.get('role')?.value

  // 🚫 If no role — block access
  if (!role) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  // 🔐 Role-based routing rules
  if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && !['admin', 'superadmin'].includes(role)) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/store') && !['merchant_owner', 'manager', 'cashier'].includes(role)) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  // ✅ Passed all checks
  return NextResponse.next()
}

// ✅ Only run for these routes
export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}
