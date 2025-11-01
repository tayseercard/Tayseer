// app/(admin)/admin/stores/new/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Store • Admin" };

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function NewStorePage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  const ok = searchParams?.ok === "1";
  const err = searchParams?.error ?? "";

  async function createStoreAction(formData: FormData) {
    "use server";
    const admin = getAdminClient();
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://tayseercard.vercel.app";

    const name = formData.get("name")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const phone = formData.get("phone")?.toString().trim() ?? "";
    const address = formData.get("address")?.toString().trim() ?? "";
    const wilaya = formData.get("wilaya")
      ? Number(formData.get("wilaya"))
      : null;

    // 1️⃣ Create store
    const { data: store, error: errStore } = await admin
      .from("stores")
      .insert([{ name, email, phone, address, wilaya }])
      .select("id")
      .single();

    if (errStore) {
      redirect(
        `/admin/stores/new?error=${encodeURIComponent(errStore.message)}`
      );
    }

    // 2️⃣ Send magic link
    await fetch(`${base}/api/send-magic`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        redirectTo: `${base}/auth/callback?redirectTo=/store`,
      }),
    }).catch(() => {});

    redirect(`/admin/stores/new?ok=1`);
  }

  return (
    <div className="space-y-6 text-black">
      <h1 className="text-xl font-semibold">Add Store</h1>

      {ok && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ Store created and magic link sent!
        </div>
      )}
      {!!err && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {err}
        </div>
      )}

      <form
        action={createStoreAction}
        className="grid max-w-xl gap-4 rounded-2xl border bg-white p-5 shadow-sm"
      >
        <div>
          <label className="block text-sm text-gray-600">Store name *</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Confiserie du bonheur"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Owner email *</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="owner@example.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">Phone</label>
            <input
              name="phone"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="+213 ..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Wilaya</label>
            <input
              name="wilaya"
              type="number"
              min={1}
              max={58}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Address</label>
          <input
            name="address"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Create & Send Magic Link
          </button>
        </div>

        <p className="text-xs text-gray-500">
          The owner receives a magic link and logs in to <code>/store</code>.
        </p>
      </form>
    </div>
  );
}
