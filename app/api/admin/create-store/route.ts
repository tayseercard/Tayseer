import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing store name or email" },
        { status: 400 }
      );
    }

    // 1️⃣ Ensure user exists (create if not)
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = list.users.find((u: any) => u.email === email);

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: "store_owner" },
      });
      if (createError) throw createError;
      user = created.user;

      // (Optional) TODO: send tempPassword by email here
    }

    // 2️⃣ Insert the store
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .insert([{ name, email, phone, address, wilaya, status: "open" }])
      .select()
      .single();
    if (storeError) throw storeError;

    // 3️⃣ Assign role in me_effective_role
    const { error: roleError } = await supabaseAdmin
      .from("me_effective_role")
      .insert([
        {
          user_id: user.id,
          role: "store_owner",
          store_id: store.id,
          store_name: store.name,
        },
      ]);
    if (roleError && !roleError.message.includes("duplicate key")) throw roleError;

    // ✅ Always return JSON
    return NextResponse.json({
      success: true,
      store,
      user_id: user.id,
    });
  } catch (err: any) {
    console.error("❌ Error creating store:", err);
    // ✅ Ensure JSON return even on crash
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
