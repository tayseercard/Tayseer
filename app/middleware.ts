import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PATHS = ['/admin', '/store', '/superadmin']

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()

  // Create a response we can modify if needed
  const res = NextResponse.next()

  // Handle async cookies in Next 15+
  const cookies =
    typeof (req.cookies as any).then === 'function'
      ? await req.cookies
      : req.cookies

  // ✅ Create Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.delete({ name, ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 🧱 CASE 1: Protected areas
  if (PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))) {
    // ❌ Not logged in
    if (!user) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // ✅ Logged in → fetch roles
    const { data: roles, error } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    if (error || !roles?.length) {
      // No roles? Deny access
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const roleList = roles.map((r) => r.role)
    const isSuperadmin = roleList.includes('superadmin')
    const isAdmin = roleList.includes('admin')
    const isStore =
      roleList.includes('store_owner') ||
      roleList.includes('manager') ||
      roleList.includes('cashier')

    // 🔐 Role-based checks
    if (url.pathname.startsWith('/superadmin') && !isSuperadmin) {
      // Superadmin only
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    if (url.pathname.startsWith('/admin') && !(isAdmin || isSuperadmin)) {
      // Admin or Superadmin only
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    if (url.pathname.startsWith('/store') && !(isStore || isSuperadmin)) {
      // Store roles or Superadmin
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // ✅ Authorized → allow through
    return res
  }

  // 🧱 CASE 2: Already logged in and trying to visit /auth/login
  if (url.pathname.startsWith('/auth/login') && user) {
    const { data: roles } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    const roleList = roles?.map((r) => r.role) || []
    const dest = roleList.includes('superadmin')
      ? '/superadmin'
      : roleList.includes('admin')
      ? '/admin'
      : '/store'

    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Default: allow everything else
  return res
}

// ✅ Secure all protected routes
export const config = {
  matcher: ['/admin/:path*', '/store/:path*', '/superadmin/:path*', '/auth/login'],
}
