import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
  try {
    // 👇 Clone headers & cookies
    const headers = new Headers(req.headers)
    const response = NextResponse.next()

    // ✅ Create Supabase SSR client (handles session cookies manually)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            const cookieHeader = headers.get('cookie')
            if (!cookieHeader) return undefined
            const cookies = Object.fromEntries(
              cookieHeader.split(';').map((c) => {
                const [k, ...v] = c.trim().split('=')
                return [k, decodeURIComponent(v.join('='))]
              })
            )
            return cookies[name]
          },
          set(name, value, options) {
            // ✅ Forward any Supabase cookie updates to client
            response.cookies.set({ name, value, ...options })
          },
          remove(name, options) {
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )

    // ✅ Touch the session to sync cookies
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    // Optional: log session metadata for debugging
    console.log('✅ Session synced for user:', data.session?.user?.email)

   return NextResponse.json(
  { ok: true, session: data.session },
  {
    status: 200,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL!,
      'Access-Control-Allow-Credentials': 'true',
    },
  }


    )
  } catch (err: any) {
    console.error('❌ /api/auth/callback error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      '✅ Supabase auth callback ready. Use POST from client after sign-in.',
  })
}
