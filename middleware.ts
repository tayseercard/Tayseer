import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🧱 Define protected routes
const PROTECTED = ['/admin', '/superadmin', '/store']

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // ✅ Check if this is a protected path
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // ✅ Check for Supabase auth cookies
  const hasAccess = req.cookies.has('sb-access-token')
  const hasRefresh = req.cookies.has('sb-refresh-token')

  // ⚠️ Allow edge cases where Supabase may still be setting cookies
  const isReturningFromLogin = req.headers.get('referer')?.includes('/auth/login')

  if (!hasAccess && !hasRefresh && !isReturningFromLogin) {
    // Redirect to login if no session cookies
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// ✅ Apply only to these routes
export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}
