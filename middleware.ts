// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🧱 Protected route prefixes
const PROTECTED_PREFIXES = ['/admin', '/superadmin', '/store']

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // ✅ Only protect if path starts with a protected prefix
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // ✅ Supabase cookies check
  const hasAccess = req.cookies.has('sb-access-token')
  const hasRefresh = req.cookies.has('sb-refresh-token')

  // ✅ Avoid infinite redirects after login
  const isReturningFromLogin = req.headers.get('referer')?.includes('/auth/login')

  // ❌ Not logged in → redirect to login
  if (!hasAccess && !hasRefresh && !isReturningFromLogin) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ✅ Allow access
  return NextResponse.next()
}

// ✅ Middleware applies to all nested admin/store/superadmin routes
export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}
