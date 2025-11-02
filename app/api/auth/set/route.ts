// app/api/auth/set/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json()

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
  cookieStore.set('sb-refresh-token', refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  return NextResponse.json({ success: true })
}
