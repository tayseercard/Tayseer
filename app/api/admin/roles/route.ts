import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/* ========= Types ========= */
type RoleBody = {
  email?: string;
  id?: string;
  role: string;
  store_id?: string | null;
  store_name?: string | null;
};

/* ========= Admin Client ========= */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ========= Helper: Check Superadmin ========= */
async function assertSuperAdmin() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: roles, error } = await supabase
    .from("me_effective_role")
    .select("role")
    .eq("user_id", user.id);

  if (error) throw error;

  const isSuper = roles?.some((r) => r.role === "superadmin");
  if (!isSuper) throw new Error("Forbidden — requires superadmin privileges");

  return user;
}

/* ========= GET (list all roles) ========= */
export async function GET() {
  try {
    await assertSuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("v_roles_with_emails")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}


/* ========= POST (create or invite user + assign role) ========= */
export async function POST(req: Request) {
  try {
    await assertSuperAdmin();
    const { email, role, store_id, store_name } = (await req.json()) as RoleBody;

    if (!email || !role)
      return NextResponse.json({ error: "Missing email or role" }, { status: 400 });

    // 1️⃣ Try to get user by email
    let user: any = null;
    let foundErr = null;

    try {
      // Some versions of supabase-js have getUserByEmail()
      const adminApi: any = supabaseAdmin.auth.admin as any;
      if (typeof adminApi.getUserByEmail === "function") {
        const { data, error } = await adminApi.getUserByEmail(email);
        foundErr = error;
        user = data?.user;
      } else {
        // Fallback to listUsers()
        const { data: userList, error: listErr } = await adminApi.listUsers();
        foundErr = listErr;
        user = userList?.users.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
      }
    } catch (err: any) {
      foundErr = err;
    }

    if (foundErr) throw foundErr;

    // 2️⃣ Create user if not found
    if (!user) {
      const { data, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      user = data.user;
    }

    if (!user?.id) throw new Error("Failed to resolve user ID");

    // 3️⃣ Prevent duplicate roles
    const { data: existingRole } = await supabaseAdmin
      .from("me_effective_role")
      .select("id")
      .eq("user_id", user.id)
      .eq("store_id", store_id || null)
      .maybeSingle();

    if (existingRole)
      return NextResponse.json(
        { error: "Role already exists for this user/store" },
        { status: 400 }
      );

    // 4️⃣ Insert role
    const { error: insertErr } = await supabaseAdmin
      .from("me_effective_role")
      .insert([
        {
          user_id: user.id,
          role,
          store_id: store_id || null,
          store_name: store_name || null,
        },
      ]);

    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role, store_id, store_name },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}

/* ========= PUT (update role info) ========= */
export async function PUT(req: Request) {
  try {
    await assertSuperAdmin();
    const { id, role, store_id, store_name } = (await req.json()) as RoleBody;

    if (!id || !role)
      return NextResponse.json({ error: "Missing id or role" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("me_effective_role")
      .update({
        role,
        store_id: store_id || null,
        store_name: store_name || null,
      })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}

/* ========= DELETE (remove role) ========= */
export async function DELETE(req: Request) {
  try {
    await assertSuperAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("me_effective_role")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}
