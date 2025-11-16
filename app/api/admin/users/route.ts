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

    // 2️⃣ Fetch all users
    const { data: list, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    // 3️⃣ Fetch all cashiers (so we don’t do 1 query per row)
    const { data: cashiers, error: cashierErr } = await supabase
      .from('cashiers')
      .select('user_id, full_name')

    if (cashierErr) throw cashierErr

    // 4️⃣ Merge
    const merged = roles.map((r) => {
      const user = list.users.find((u) => u.id === r.user_id)
      const cashier = r.role === 'cashier'
        ? cashiers.find((c) => c.user_id === r.user_id)
        : null

      return {
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        store_id: r.store_id,
        store_name: r.store_name,
        created_at: r.created_at,

        // Supabase Auth fields
        email: user?.email ?? '—',
        auth_created_at: user?.created_at ?? null,
        confirmed: !!user?.confirmed_at,

        // NEW: Cashier fields
        cashier_full_name: cashier?.full_name ?? null,
      }
    })

    return NextResponse.json({ users: merged })
  } catch (err: any) {
    console.error('❌ Error fetching users:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
