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
            console.error("❌ Auth Creation Error:", {
                message: authError.message,
                status: authError.status,
                code: authError.code
            });
            return NextResponse.json(
                { error: "Erreur lors de la création du compte : " + authError.message },
                { status: authError.status || 400 }
            );
        }

        const userId = authData.user.id;
        console.log("✅ User created:", userId);

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

        if (storeError) {
            console.error("❌ Store Creation Error:", storeError);

            // If the error is about plan_id column, it's a known migration issue
            if (storeError.message?.includes('column "plan_id" of relation "stores" does not exist')) {
                console.warn("⚠️ 'plan_id' column missing. Retrying insert without it.");
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
                // Cleanup the user if store creation fails
                console.log("🧹 Cleaning up user:", userId);
                await supabaseAdmin.auth.admin.deleteUser(userId);
                return NextResponse.json(
                    { error: "Erreur lors de la configuration de la boutique : " + storeError.message },
                    { status: 400 }
                );
            }
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
