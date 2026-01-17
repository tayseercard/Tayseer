import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    try {
        const { email, password, storeName, fullName, phone, wilaya, planId } = await req.json();

        if (!email || !password || !storeName) {
            return NextResponse.json(
                { error: "Veuillez remplir tous les champs obligatoires." },
                { status: 400 }
            );
        }

        // 1️⃣  Create User in Supabase Auth
        // Use user_metadata to pass role and full_name which might be expected by database triggers
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: "store_owner",
                full_name: fullName || storeName
            }
        });

        if (authError) {
            console.error("❌ Auth Creation Error:", authError);
            return NextResponse.json({ error: "Erreur lors de la création du compte : " + authError.message }, { status: 400 });
        }

        const userId = authData.user.id;

        // 2️⃣  Create Store record
        // This will trigger 'trg_link_store_owner' which automatically handles roles (me_effective_role)
        let storeData: any = {
            name: storeName,
            email: email,
            phone: phone || null,
            wilaya: wilaya ? Number(wilaya) : null,
            owner_user_id: userId,
            temp_password_set: true,
            status: 'inactive',
            plan_id: planId || 'starter'
        };

        let { data: store, error: storeError } = await supabaseAdmin
            .from("stores")
            .insert([storeData])
            .select()
            .single();

        // Fallback: If migration hasn't been run and plan_id column is missing
        if (storeError && storeError.message?.includes('column "plan_id" of relation "stores" does not exist')) {
            console.warn("⚠️ 'plan_id' column missing in DB. Retrying insert without it. Please run migration 030.");
            delete storeData.plan_id;
            const retry = await supabaseAdmin
                .from("stores")
                .insert([storeData])
                .select()
                .single();
            store = retry.data;
            storeError = retry.error;
        }

        if (storeError) {
            console.error("❌ Store Creation Error:", storeError);
            // Cleanup the user if store creation fails to allow future retries
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: "Erreur lors de la configuration de la boutique : " + storeError.message }, { status: 400 });
        }

        // Result: Triggers will automatically link 'store_owner' role and sync metadata.
        // HOWEVER, to be safe and robust against missing triggers, let's explicitly add the role here too.
        // We use upsert or ignore constraint violations.

        try {
            await supabaseAdmin.from('me_effective_role').insert({
                user_id: userId,
                role: 'store_owner',
                store_id: store.id,
                store_name: store.name
            });
        } catch (roleError) {
            console.warn("⚠️ Validation role insert failed (might be handled by trigger):", roleError);
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("🔥 Critical Signup API Error:", err);
        return NextResponse.json(
            { error: "Une erreur interne est survenue. Veuillez réessayer plus tard." },
            { status: 500 }
        );
    }
}
