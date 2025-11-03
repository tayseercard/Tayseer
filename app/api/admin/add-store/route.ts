export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    let body = {}
    try {
      body = await req.json()
    } catch {
      console.warn('⚠️ No JSON body received')
    }

    const { name, email, phone, address, wilaya } = body as any

    if (!name || !email)
      return NextResponse.json(
        { error: 'Missing store name or email', received: body },
        { status: 400 }
      )

    // --- test DB connection ---
    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert([{ name, email, phone, address, wilaya }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, store: data })
  } catch (err: any) {
    console.error('❌ Internal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

