// app/admin/settings/page.tsx
import { createClient } from "@supabase/supabase-js";
import StoresPasswordList from "./StoresPasswordList";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function SettingsPage() {
  const { data: stores, error } = await supabaseAdmin
    .from("stores")
    .select("id, name, email, temp_password, temp_password_set, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load stores:", error);
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center text-red-600 text-sm sm:text-base">
        ⚠️ Could not load stores
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black px-4 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page title */}
        <header className="text-center sm:text-left">
          <h1 className="text-lg sm:text-xl font-semibold mb-1">Settings</h1>
          <p className="text-sm text-gray-500">
            Manage store access and temporary passwords
          </p>
        </header>

        {/* Section: Stores Temporary Passwords */}
        <section className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium mb-4">
            Stores Temporary Passwords
          </h2>

          <div className="overflow-x-auto">
            <StoresPasswordList stores={stores || []} />
          </div>
        </section>
      </div>
    </div>
  );
}
