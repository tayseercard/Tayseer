"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("platform-admin");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Optional: gate the page (only admins)
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s?.session) return router.replace("/auth/login?redirectTo=/admin/users");
      const { data: me } = await supabase
        .from("me_effective_role")
        .select("role")
        .eq("user_id", s.session.user.id)
        .maybeSingle();
      if (me?.role !== "admin") return router.replace("/auth/login?redirectTo=/admin/users");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, username }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(data?.error ?? "Failed to invite user.");
    setMsg("Invite sent. They’ll get an email; after clicking it, they land on /auth/callback and will be routed to /admin.");
    setEmail("");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Invite a Platform Admin</h1>
      <form onSubmit={onInvite} className="grid gap-3 rounded-xl border p-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Email</span>
          <input
            type="email"
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="admin@tayseer.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Username (internal)</span>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        {err && <p className="text-sm text-rose-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send Invite"}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          The invite link redirects to <code>/auth/callback?redirectTo=/admin</code>.
          Your callback page should call <code>exchangeCodeForSession()</code> and then route by role.
        </p>
      </form>
    </div>
  );
}
