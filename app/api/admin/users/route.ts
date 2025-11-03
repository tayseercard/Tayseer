import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ Use the service role key on the server (not in client-side env!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 1️⃣ Get roles from the table
    const { data: roles, error: rolesError } = await supabase
      .from('me_effective_role')
      .select('*')
      .order('created_at', { ascending: false })

    if (rolesError) throw rolesError

    // 2️⃣ List users (server-side, service key allowed)
    const { data: list, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    // 3️⃣ Merge users and roles
    const merged = roles.map((r) => {
      const user = list.users.find((u) => u.id === r.user_id)
      return {
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        store_name: r.store_name,
        created_at: r.created_at,
        email: user?.email ?? '—',
        user_created_at: user?.created_at ?? null,
        confirmed: !!user?.confirmed_at,
        app_role: user?.user_metadata?.role ?? null,
      }
    })

    return NextResponse.json({ users: merged })
  } catch (err: any) {
    console.error('❌ Error fetching users:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
