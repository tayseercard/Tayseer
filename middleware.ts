import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PATHS = ['/admin', '/store', '/superadmin']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const url = req.nextUrl.clone()

  // ✅ Fix async cookies handling for Next 15+
  const cookieSource: any =
    typeof (req.cookies as any).then === 'function'
      ? await req.cookies
      : req.cookies

  // ✅ Create Supabase server client safely
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieSource.get(name)?.value
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

  // 🧱 Case 1: Protected routes
  if (PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))) {
    if (!user) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 🧠 Fetch user roles
    const { data: roles } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    const roleList = roles?.map((r) => r.role) || []
    const isSuperadmin = roleList.includes('superadmin')
    const isAdmin = roleList.includes('admin')
    const isStore =
      roleList.includes('store_owner') ||
      roleList.includes('manager') ||
      roleList.includes('cashier')

    // 🔐 Role-based redirections
    if (url.pathname.startsWith('/superadmin') && !isSuperadmin)
      return NextResponse.redirect(new URL('/auth/login', req.url))

    if (url.pathname.startsWith('/admin') && !(isAdmin || isSuperadmin))
      return NextResponse.redirect(new URL('/auth/login', req.url))

    if (url.pathname.startsWith('/store') && !(isStore || isSuperadmin))
      return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // 🧱 Case 2: Visiting /auth/login while already logged in
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

  return res
}

// ✅ Protect these routes
export const config = {
  matcher: ['/admin/:path*', '/store/:path*', '/superadmin/:path*', '/auth/login'],
}
