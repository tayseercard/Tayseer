// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
      },
    }
  )

  // 1️⃣ Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 2️⃣ Fetch user role
  const { data: roleRow, error } = await supabase
    .from('me_effective_role')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle()

  const role = roleRow?.role
  if (error) console.error('Role fetch error:', error)

  // 3️⃣ Role-based restrictions
  if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/store') && role !== 'store_owner') {
    url.pathname = '/403'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/superadmin/:path*', '/admin/:path*', '/store/:path*'],
}
