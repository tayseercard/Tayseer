import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 1️⃣ Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from('me_effective_role')
      .select('*')
      .order('created_at', { ascending: false })

    if (rolesError) throw rolesError

    // 2️⃣ Fetch all users (Supabase Auth)
    const { data: list, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    // 3️⃣ Fetch all cashiers once
    const { data: cashiers, error: cashierErr } = await supabase
      .from('cashiers')
      .select('user_id, full_name')

    if (cashierErr) throw cashierErr

    // 4️⃣ Fetch all stores once
    const { data: stores, error: storesErr } = await supabase
      .from('stores')
      .select('id, temp_password, temp_password_set')

    if (storesErr) throw storesErr

    // 5️⃣ Merge everything
    const merged = roles.map((r) => {
      const authUser = list.users.find((u) => u.id === r.user_id)

      // cashier full name
      const cashier = r.role === 'cashier'
        ? cashiers.find((c) => c.user_id === r.user_id)
        : null

      // store temp password for store_owner or manager or cashier
      const store = stores.find((s) => s.id === r.store_id) || null

      return {
        id: r.id,
        user_id: r.user_id,
        role: r.role,

        store_id: r.store_id,
        store_name: r.store_name,
        store_temp_password: store?.temp_password ?? null,
        store_temp_password_set: store?.temp_password_set ?? false,

        created_at: r.created_at,

        email: authUser?.email ?? '—',
        auth_created_at: authUser?.created_at ?? null,
        confirmed: !!authUser?.confirmed_at,

        cashier_full_name: cashier?.full_name ?? null,
      }
    })

    return NextResponse.json({ users: merged })

  } catch (err: any) {
    console.error('❌ Error fetching users:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
