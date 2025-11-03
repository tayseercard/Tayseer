export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    console.log('🟢 API HIT /api/admin/add-store')

    console.log('🔑 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log(
      '🔑 SERVICE KEY prefix:',
      process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)
    )

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin.from('stores').select('*').limit(1)

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Connection works, first store row:', data)
    return NextResponse.json({ success: true, message: 'Ping OK', data })
  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
