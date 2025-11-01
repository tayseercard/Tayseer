import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();
  const { email, role, store_id, store_name } = body;

  if (!email || !role)
    return NextResponse.json({ error: "Email and role are required." }, { status: 400 });

  // 1️⃣ Look up the user by email
  const { data: user } = await supabase
    .from("auth.users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  let user_id = user?.id;

  // 2️⃣ If user doesn’t exist, invite them (creates an Auth user)
  if (!user_id) {
    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` }
    );
    if (inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    user_id = invited?.user?.id;
  }

  // 3️⃣ Insert role record
  const { error: insertError } = await supabase
    .from("me_effective_role")
    .insert({
      user_id,
      role,
      store_id: store_id || null,
      store_name: store_name || null,
    });

  if (insertError)
    return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("me_effective_role").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
