import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Add /superadmin here
const PROTECTED_PATHS = ['/admin', '/store', '/superadmin']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const url = req.nextUrl.clone()

  // ⚙️ Handle async cookies in Next 15+
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

  // 🧩 CASE 1: Protected areas (admin/store/superadmin)
  if (PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))) {
    if (!user) {
      url.pathname = '/auth/login'
      url.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Fetch all roles for the user
    const { data: roles } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    const roleList = roles?.map((r) => r.role) || []
    const isSuperadmin = roleList.includes('superadmin')
    const isAdmin = roleList.includes('admin')
    const isStore = roleList.includes('store_owner') || roleList.includes('manager') || roleList.includes('cashier')

    // 🔐 Role-based access checks
    if (url.pathname.startsWith('/superadmin') && !isSuperadmin) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    if (url.pathname.startsWith('/admin') && !(isAdmin || isSuperadmin)) {
      return NextResponse.redirect(new URL('/store', req.url))
    }

    if (url.pathname.startsWith('/store') && isSuperadmin) {
      return NextResponse.redirect(new URL('/superadmin', req.url))
    }
  }

  // 🧩 CASE 2: Visiting login while already authenticated
  if (url.pathname.startsWith('/auth/login')) {
    if (user) {
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

  return res
}

// Match all protected routes
export const config = {
  matcher: ['/admin/:path*', '/store/:path*', '/superadmin/:path*'],
}
