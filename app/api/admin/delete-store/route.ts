import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { store_id } = body

    if (!store_id)
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 })

    // Check if store has vouchers (prevent accidental deletion of stores with data)
    const { count, error: countError } = await supabaseAdmin
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store_id)

    if (countError) throw countError

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete store with existing vouchers' },
        { status: 400 }
      )
    }

    // Delete the store (cascading delete should handle related payments/etc if configured in DB)
    const { error: deleteError } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', store_id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Failed to delete store:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
