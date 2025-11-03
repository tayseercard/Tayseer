"use client";
import { useState } from "react";

export default function StoresPasswordList({ stores: initialStores }: { stores: any[] }) {
  const [stores, setStores] = useState(initialStores);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/list-stores");
    const data = await res.json();
    setStores(data.stores || []);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Stores Temporary Passwords</h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="border rounded px-3 py-1 text-xs"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <div className="overflow-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Store</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Temp password</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => {
              const shown = visible[s.id];
              const pw = s.temp_password || "—";
              const masked = pw === "—" ? "—" : pw.replace(/./g, "•");
              return (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2">{s.email ?? "—"}</td>
                  <td className="px-3 py-2 font-mono">{shown ? pw : masked}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() =>
                        setVisible((v) => ({ ...v, [s.id]: !v[s.id] }))
                      }
                      className="mr-2 rounded border px-2 py-1 text-xs"
                    >
                      {shown ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
