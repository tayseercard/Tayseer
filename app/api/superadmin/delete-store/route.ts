// app/api/admin/delete-store/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id)
      return NextResponse.json({ error: "Missing store ID" }, { status: 400 });

    // 1. Find owner_user_id before deleting store
    const { data: store, error: fetchError } = await supabaseAdmin
      .from("stores")
      .select("owner_user_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Delete the store
    const { error: deleteError } = await supabaseAdmin
      .from("stores")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // 3. Delete owner from Supabase Auth
    if (store?.owner_user_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(store.owner_user_id);
      if (authError) {
        console.warn('⚠️ Could not delete auth user:', authError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Failed to delete store:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
