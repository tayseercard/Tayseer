import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 👑 Admin client with Service Role Key (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: storeId } = await context.params

  try {
    const { data, error } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ vouchers: data })
  } catch (err: any) {
    console.error('❌ Error fetching vouchers for store:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
