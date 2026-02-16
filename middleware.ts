import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Try to get session, handle refresh token errors gracefully
  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch (error) {
    // Silently handle refresh token errors (happens after logout)
    console.log('Session refresh failed (likely after logout):', error)
  }

  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // 🟩 Allow public routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/403')) return res

  // 🟩 Check protected routes
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/superadmin') ||
    pathname.startsWith('/store')

  if (!isProtected) return res

  // 🟥 Not logged in → redirect
  if (!session) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 🧩 Try getting role from JWT
  let role = session.user.app_metadata?.role;

  // 🧠 Fallback: query from me_effective_role
  if (!role) {
    const { data: roleData, error } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error) console.error('Role fetch error:', error.message)
    role = roleData?.role ?? null
  }

  console.log('🧠 Middleware → user:', session.user.id, '| role:', role)

  // 🟥 Still no role → forbid
  if (!role) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  // ✅ Role-based route access
  if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && !['admin', 'superadmin'].includes(role)) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/store') && !['store_owner'].includes(role)) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/cashier') && !['cashier'].includes(role)) {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/store/:path*'],
}

