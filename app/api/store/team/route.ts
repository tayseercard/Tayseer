import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1️⃣ Get current user's store_id
        const { data: me } = await supabase
            .from('me_effective_role')
            .select('store_id, role')
            .eq('user_id', session.user.id)
            .maybeSingle()

        if (!me?.store_id) {
            return NextResponse.json({ error: 'No store associated' }, { status: 403 })
        }

        // Only store_owner and store_admin (or similar) should see the full team
        // If we want to allow any team member to see the list, we can skip this check
        // but let's assume at least some basic access control.

        // 2️⃣ Get all roles for this store
        const { data: teamRoles, error: rolesError } = await supabaseAdmin
            .from('me_effective_role')
            .select('user_id, role, created_at, id')
            .eq('store_id', me.store_id)
            .order('created_at', { ascending: false })

        if (rolesError) throw rolesError

        // 3️⃣ Fetch user details from auth.users (requires service role)
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        if (authError) throw authError

        // 4️⃣ Fetch from cashiers table as fallback for names/emails
        const { data: cashierRows } = await supabaseAdmin
            .from('cashiers')
            .select('*')
            .eq('store_id', me.store_id)

        // 5️⃣ Merge roles, auth, and cashier data
        const team = teamRoles.map(roleRow => {
            const authUser = users.find(u => u.id === roleRow.user_id)
            const cashier = cashierRows?.find(c => c.user_id === roleRow.user_id)

            return {
                ...roleRow,
                email: authUser?.email || cashier?.email || 'N/A',
                full_name: authUser?.user_metadata?.full_name || cashier?.full_name || authUser?.email?.split('@')[0] || 'Unknown'
            }
        })

        return NextResponse.json({ team })

    } catch (err: any) {
        console.error('❌ Error fetching team:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
