import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const PROTECTED_PATHS = ['/superadmin', '/admin', '/store']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // ✅ Create a Supabase client bound to the request/response cookies
  const supabase = createMiddlewareClient({ req, res })

  // ✅ Get session user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = req.nextUrl.clone()
  const isProtected = PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))

  // 🔒 Not logged in → redirect to login
  if (isProtected && !user) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ✅ Logged in → check roles
  if (isProtected && user) {
    const { data: roles, error } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    if (error || !roles?.length) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const roleList = roles.map((r) => r.role)
    const isSuperadmin = roleList.includes('superadmin')
    const isAdmin = roleList.includes('admin')
    const isStore =
      roleList.includes('store_owner') ||
      roleList.includes('manager') ||
      roleList.includes('cashier')

    if (url.pathname.startsWith('/superadmin') && !isSuperadmin)
      return NextResponse.redirect(new URL('/auth/login', req.url))

    if (url.pathname.startsWith('/admin') && !(isAdmin || isSuperadmin))
      return NextResponse.redirect(new URL('/auth/login', req.url))

    if (url.pathname.startsWith('/store') && !(isStore || isSuperadmin))
      return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/superadmin/:path*', '/admin/:path*', '/store/:path*'],
}
