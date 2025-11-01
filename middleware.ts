import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ✅ All protected routes
const PROTECTED_PATHS = ['/admin', '/store', '/superadmin']

export async function middleware(req: NextRequest) {
  // Clone URL so we can modify it
  const url = req.nextUrl.clone()

  // Always start with a modifiable response
  const res = NextResponse.next()

  // ✅ Handle async cookies safely (Next 15 compatibility)
  const cookies =
    typeof (req.cookies as any).then === 'function'
      ? await req.cookies
      : req.cookies

  // ✅ Create Supabase server client (SSR-safe)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies.get(name)?.value
        },
        set(name, value, options) {
          try {
            res.cookies.set({ name, value, ...options })
          } catch {}
        },
        remove(name, options) {
          try {
            res.cookies.delete({ name, ...options })
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // 🧩 CASE 1 — Protected routes: /admin, /store, /superadmin
  if (PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))) {
    if (userError) console.error('Supabase getUser error:', userError)

    // ❌ No user → redirect to login
    if (!user) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // ✅ Fetch user roles
    const { data: roles, error: roleErr } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    if (roleErr) {
      console.error('Role fetch error:', roleErr)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    if (!roles?.length) {
      console.warn('User has no roles:', user.email)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const roleList = roles.map((r) => r.role)
    const isSuperadmin = roleList.includes('superadmin')
    const isAdmin = roleList.includes('admin')
    const isStore =
      roleList.includes('store_owner') ||
      roleList.includes('manager') ||
      roleList.includes('cashier')

    // 🔐 Role-based access
    if (url.pathname.startsWith('/superadmin') && !isSuperadmin)
      return NextResponse.redirect(new URL('/auth/login', req.url))

    if (url.pathname.startsWith('/admin') && !(isAdmin || isSuperadmin))
      return NextResponse.redirect(new URL('/auth/login', req.url))

    if (url.pathname.startsWith('/store') && !(isStore || isSuperadmin))
      return NextResponse.redirect(new URL('/auth/login', req.url))

    // ✅ Authorized → allow
    return res
  }

  // 🧩 CASE 2 — Already logged in and visiting /auth/login
  if (url.pathname === '/auth/login' && user) {
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

  // ✅ Default — allow
  return res
}

// ✅ Run only on protected + login routes
export const config = {
  matcher: ['/admin/:path*', '/store/:path*', '/superadmin/:path*', '/auth/login'],
}
