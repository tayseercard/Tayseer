import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    console.log("🔍 list-users API hit");

    const { data, error } = await supabaseAdmin
      .from("me_effective_role")
      .select(`
        user_id,
        store_id,
        store_name,
        role, 
        created_at , 
         stores:store_id (
      id,
      name,
      email,
      phone,
      address,
      wilaya,
      owner_user_id
    )
   
        
     
        `);

    if (error) {
      console.error("❌ Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (e: any) {
    console.error("💥 API crashed:", e);
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
