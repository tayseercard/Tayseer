import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * Admin-only endpoint: send store owner password setup link
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL || "https://tayseercard.vercel.app";
  const redirectTo = `${origin}/auth/reset-password`;

  // ✅ Use Supabase Admin API to invite or send reset link
  const { data, error } = await supabase.auth.admin
    .inviteUserByEmail(email, { redirectTo });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
