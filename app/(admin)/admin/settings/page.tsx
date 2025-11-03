// app/admin/settings/page.tsx
import { createClient } from "@supabase/supabase-js";
import StoresPasswordList from "./StoresPasswordList";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function SettingsPage() {
  // Fetch stores (with sensitive info)
  const { data: stores, error } = await supabaseAdmin
    .from("stores")
    .select("id, name, email, temp_password, temp_password_set, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load stores:", error);
    return <div className="text-red-600">⚠️ Could not load stores</div>;
  }

  return (
    <div className="p-6 text-black">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <section className="mt-6">
        <h2 className="text-lg font-medium mb-3">Stores Temporary Passwords</h2>
        <StoresPasswordList stores={stores || []} />
      </section>
    </div>
  );
}
