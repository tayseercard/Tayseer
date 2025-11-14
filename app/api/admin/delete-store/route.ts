import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await req.json()
  const { store_id } = body

  if (!store_id)
    return NextResponse.json({ error: 'Missing store_id' }, { status: 400 })

  // OPTIONAL: prevent deletion if vouchers exist
  const { count } = await supabase
    .from('vouchers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store_id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Cannot delete store with existing vouchers' },
      { status: 400 }
    )
  }

  // Delete
  const { error } = await supabase.from('stores').delete().eq('id', store_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
