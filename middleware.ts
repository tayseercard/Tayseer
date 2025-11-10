import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // ✅ Public routes — do NOT require login
  const PUBLIC_PATHS = ['/', '/auth', '/api', '/403', '/v']
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return res

  // ✅ Protected sections
  const isAdmin = pathname.startsWith('/admin')
  const isSuper = pathname.startsWith('/superadmin')
  const isStore = pathname.startsWith('/store')

  // 🔒 If no session → redirect to login
  if (!session && (isAdmin || isSuper || isStore)) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ✅ Role-based restrictions (optional)
  if (session) {
    let role = session.user.user_metadata?.role

    if (!role) {
      const { data: roleData } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()
      role = roleData?.role
    }

    // Role checks
    if (isSuper && role !== 'superadmin') {
      url.pathname = '/403'
      return NextResponse.redirect(url)
    }
    if (isAdmin && !['admin', 'superadmin'].includes(role)) {
      url.pathname = '/403'
      return NextResponse.redirect(url)
    }
    if (isStore && !['store_owner', 'manager', 'cashier'].includes(role)) {
      url.pathname = '/403'
      return NextResponse.redirect(url)
    }
  }

  return res
}

// ✅ Middleware will run only where needed
export const config = {
  matcher: [
    '/admin/:path*',
    '/superadmin/:path*',
    '/store/:path*',
    '/auth/:path*',
    '/', // optional for landing
  ],
}
