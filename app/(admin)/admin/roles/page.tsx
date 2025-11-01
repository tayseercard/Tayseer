'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, Trash, Plus, RefreshCcw } from 'lucide-react';

export default function AdminRolesPage() {
  const supabase = createClientComponentClient();

  const [roles, setRoles] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // ✅ Fetch all roles with user email
  const fetchRoles = async () => {
    setLoading(true);

    // You can either query the SQL view `v_roles_with_emails`
    // OR use the direct join with `auth.users` (like this)
    const { data, error } = await supabase
      .from('me_effective_role')
      .select(`
        id,
        user_id,
        role,
        store_id,
        store_name,
        created_at,
        users:auth.users(email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setMsg(`❌ ${error.message}`);
    } else if (data) {
      setRoles(data);
    }

    setLoading(false);
  };

  // ✅ Fetch stores for dropdown
  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('id, name');
    if (data) setStores(data);
  };

  useEffect(() => {
    fetchRoles();
    fetchStores();
  }, []);

  // ✅ Add new role
  const handleAdd = async () => {
    setMsg('');
    setLoading(true);

    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role,
        store_id: storeId || null,
        store_name: storeName || null,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMsg('✅ Role added successfully');
      fetchRoles();
      setEmail('');
      setStoreId('');
      setStoreName('');
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setLoading(false);
  };

  // ✅ Delete a role
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    const res = await fetch(`/api/admin/roles?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMsg('🗑️ Role deleted');
      fetchRoles();
    } else {
      const data = await res.json();
      setMsg(`❌ ${data.error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">🧑‍💼 Manage Roles</h1>
        <button
          onClick={fetchRoles}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* ➕ Add form */}
      <div className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
        <h2 className="text-lg font-medium mb-3">Add / Invite User</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <input
            className="border rounded-md p-2 text-sm"
            placeholder="User email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select
            className="border rounded-md p-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>

          <select
            className="border rounded-md p-2 text-sm"
            value={storeId}
            onChange={(e) => {
              setStoreId(e.target.value);
              const store = stores.find((s) => s.id === e.target.value);
              setStoreName(store?.name || '');
            }}
          >
            <option value="">(No store - for superadmin)</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            disabled={loading}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-md px-3 py-2 text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            <span className="ml-2">Add</span>
          </button>
        </div>
        {msg && <p className="text-sm mt-3">{msg}</p>}
      </div>

      {/* 📋 Roles list */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Store</th>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">
                  {r.users?.email || '—'}
                </td>
                <td className="px-4 py-2 capitalize">{r.role}</td>
                <td className="px-4 py-2">{r.store_name || '—'}</td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {roles.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No roles assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
