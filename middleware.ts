import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // ✅ Public paths (no login required)
  const PUBLIC_PATHS = ['/', '/auth', '/v', '/api', '/403']
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return res

  // ✅ Protected zones
  const isAdmin = pathname.startsWith('/admin')
  const isSuperadmin = pathname.startsWith('/superadmin')
  const isStore = pathname.startsWith('/store')

  // ❌ If user not logged in → redirect to login
  if (!session && (isAdmin || isSuperadmin || isStore)) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return res
}

// ✅ Apply middleware to admin/superadmin/store
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/superadmin',
    '/superadmin/:path*',
    '/store',
    '/store/:path*',
  ],
}
