// app/admin/settings/StoresPasswordList.tsx
"use client";

import { useState } from "react";

export default function StoresPasswordList({
  stores,
}: {
  stores: {
    id: string;
    name: string;
    email: string | null;
    temp_password: string | null;
    temp_password_set: boolean | null;
  }[];
}) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  return (
    <div className="overflow-auto border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left">Store</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-left">Temporary Password</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => {
            const shown = visible[s.id];
            const pw = s.temp_password || "—";
            const masked =
              pw === "—" ? "—" : pw.replace(/./g, "•");

            return (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2">{s.email ?? "—"}</td>
                <td className="px-3 py-2 font-mono">
                  {shown ? pw : masked}
                </td>
                <td className="px-3 py-2">
                  <button
                    className="border rounded px-2 py-1 text-xs mr-2"
                    onClick={() =>
                      setVisible((v) => ({ ...v, [s.id]: !v[s.id] }))
                    }
                  >
                    {shown ? "Hide" : "Show"}
                  </button>
                  <button
                    className="border rounded px-2 py-1 text-xs"
                    onClick={() => {
                      if (!s.temp_password) return;
                      navigator.clipboard.writeText(s.temp_password);
                      alert("Copied to clipboard");
                    }}
                    disabled={!s.temp_password}
                  >
                    Copy
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
