// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()

  // simple pattern: allow access if cookie exists
  const hasSession = req.cookies.has('sb-access-token')

  if (!hasSession && url.pathname.startsWith('/admin')) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}
