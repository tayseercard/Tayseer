// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🧱 Protected route prefixes
const PROTECTED_PREFIXES = ['/admin', '/superadmin', '/store']

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // ✅ Only protect paths that start with these
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  )
  if (!isProtected) return NextResponse.next()

  // ✅ Supabase cookies check
  const hasAccess = req.cookies.has('sb-access-token')
  const hasRefresh = req.cookies.has('sb-refresh-token')

  // ✅ Avoid infinite redirect loops after login
  const isReturningFromLogin =
    req.headers.get('referer')?.includes('/auth/login')

  // ❌ Not logged in → redirect to login
  if (!hasAccess && !hasRefresh && !isReturningFromLogin) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// ✅ Let middleware run on all routes (needed for Next.js app router)
export const config = {
  matcher: ['/((?!_next|v|api|favicon.ico|robots.txt|.*\\..*).*)'],
}
