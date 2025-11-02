import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase.auth.getSession()
  if (error) console.error(error)
  return NextResponse.json({ ok: true })
}
