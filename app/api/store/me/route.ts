import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 🧩 Admin client with Service Role Key (Bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        // 1️⃣ Verify User Session
        const cookieStore = await cookies()
        // Fix for TS: auth-helpers expects a Promise returning function for cookies in newer definitions
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2️⃣ Fetch Store using Admin Client (Bypass RLS)
        console.log("🔍 Fetching store for owner:", session.user.id);
        const { data: store, error } = await supabaseAdmin
            .from('stores')
            .select('id, name, phone, address, logo_url')
            .eq('owner_user_id', session.user.id)
            .maybeSingle();

        console.log("✅ Store fetch result:", store, error);

        if (error) throw error;

        return NextResponse.json({ store });

    } catch (err: any) {
        console.error("❌ Error fetching store:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        // 1️⃣ Verify User Session
        const cookieStore = await cookies()
        // Fix for TS: auth-helpers expects a Promise returning function for cookies in newer definitions
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Construct partial update object
        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.address !== undefined) updates.address = body.address;
        if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ success: true, message: "No changes detected" });
        }

        // 2️⃣ Update Store using Admin Client
        const { data: store, error } = await supabaseAdmin
            .from('stores')
            .update(updates)
            .eq('owner_user_id', session.user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, store });

    } catch (err: any) {
        console.error("❌ Error updating store:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
