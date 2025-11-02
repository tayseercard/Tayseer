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

  if (pathname.startsWith('/auth') || pathname.startsWith('/403')) return res

  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/superadmin') ||
    pathname.startsWith('/store')

  if (!isProtected) return res

  if (!session) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  const role = session.user.user_metadata?.role

  if (!role) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

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

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}
