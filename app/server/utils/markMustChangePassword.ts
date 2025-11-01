// server/utils/markMustChangePassword.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// by email -> set user_metadata.must_change_password = true
export async function markMustChangePassword(email: string) {
  // Find user id by email
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("User not found");

  const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { must_change_password: true }
  });
  if (updErr) throw updErr;
}
