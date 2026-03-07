import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { user_id, store_id } = body

        if (!user_id || !store_id) {
            return NextResponse.json({ error: 'Missing user_id or store_id' }, { status: 400 })
        }

        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1️⃣ Verify the caller is an owner of this store
        const { data: me } = await supabase
            .from('me_effective_role')
            .select('store_id, role')
            .eq('user_id', session.user.id)
            .maybeSingle()

        if (!me || me.store_id !== store_id || me.role !== 'store_owner') {
            return NextResponse.json({ error: 'Forbidden. Only store owners can remove team members.' }, { status: 403 })
        }

        // 2️⃣ Verify the target is in the same store and is not an owner
        const { data: targetRole } = await supabaseAdmin
            .from('me_effective_role')
            .select('role')
            .eq('user_id', user_id)
            .eq('store_id', store_id)
            .maybeSingle()

        if (targetRole?.role === 'store_owner') {
            return NextResponse.json({ error: 'Cannot remove another store owner.' }, { status: 403 })
        }

        // 3️⃣ Remove user's access to this store
        // We delete from me_effective_role and cashiers, but KEEP their auth.users account
        // so any historical transactions or operations tied to this user are maintained!

        const { error: roleDeleteError } = await supabaseAdmin
            .from('me_effective_role')
            .delete()
            .eq('user_id', user_id)
            .eq('store_id', store_id)

        if (roleDeleteError) throw roleDeleteError

        const { error: cashierDeleteError } = await supabaseAdmin
            .from('cashiers')
            .delete()
            .eq('user_id', user_id)
            .eq('store_id', store_id)

        if (cashierDeleteError) throw cashierDeleteError

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('❌ Error removing member:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
