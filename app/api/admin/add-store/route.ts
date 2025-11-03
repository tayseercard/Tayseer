import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Use Service Role key — never expose this to client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json();

    if (!name || !email)
      return NextResponse.json({ error: "Missing store name or email" }, { status: 400 });

    // 1️⃣ Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    // 2️⃣ Find or create the user in Supabase Auth
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    let user = allUsers?.users.find((u: any) => u.email === email);

    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: "store_owner" },
      });
      if (error) throw error;
      user = data.user;
    }

    // 3️⃣ Create the store in public.stores
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .insert([
        {
          name,
          email,
          phone,
          address,
          wilaya,
          owner_user_id: user.id,
          temp_password_set: false,
          temp_password: tempPassword,
          status: "open",
        },
      ])
      .select()
      .single();

    if (storeError) throw storeError;

    // 4️⃣ (Optional) The trigger sync_store_owner_role() will automatically handle me_effective_role

    return NextResponse.json({
      success: true,
      store,
      temp_password: tempPassword,
    });
  } catch (err: any) {
    console.error("❌ Error creating store:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
