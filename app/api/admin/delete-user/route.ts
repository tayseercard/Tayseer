import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
    try {
        const { user_id } = await req.json()

        if (!user_id) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
        }

        // Deleting from Supabase Auth automatically deletes linked rows in 'me_effective_role'
        // because of the ON DELETE CASCADE constraint on the foreign key.
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

        if (authError) {
            // If the user doesn't exist in Auth, try to clean up the DB record anyway
            if (authError.message?.includes('User not found') || (authError as any).status === 404) {
                await supabaseAdmin.from('me_effective_role').delete().eq('user_id', user_id)
                return NextResponse.json({ success: true, warning: 'User not found in Auth, but cleared from database.' })
            }
            throw authError
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('❌ Failed to delete user:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
