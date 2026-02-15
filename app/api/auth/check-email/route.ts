import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email requis' }, { status: 400 })
        }

        // Initialize Supabase Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase credentials missing')
            // Don't error out, just allow proceed or fail closed. 
            // If we can't check, we usually shouldn't block, but for "real-time check" feature
            // we should probably return inactive check.
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
        }

        const adminDb = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const { data, error } = await adminDb.rpc('check_email_exists', {
            email_arg: email
        })

        if (error) {
            console.error('Check email RPC error:', error)
            return NextResponse.json({ error: 'Validation error' }, { status: 500 })
        }

        return NextResponse.json({ exists: data })

    } catch (e) {
        console.error('Check email server error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
