// app/(admin)/admin/users/invite/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invite User • Admin',
};

type StoreRow = {
  id: string;
  name: string | null;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function fetchStores(): Promise<StoreRow[]> {
  'use server';
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('stores')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) return [];
  return (data ?? []) as StoreRow[];
}

// ...imports unchanged...

export default async function InviteUserPage({
  searchParams,
}: {
  searchParams?: { ok?: string; email?: string; error?: string; storeId?: string; role?: string };
}) {
  const stores = await fetchStores();

  const ok = searchParams?.ok === '1';
  const emailParam = searchParams?.email ?? '';
  const errParam = searchParams?.error ?? '';
  const roleParam = (searchParams?.role ?? 'store_owner') as 'store_owner'|'cashier'|'admin';
  const storeParam = searchParams?.storeId ?? ''; // preselect this store

  async function inviteAction(formData: FormData) {
    'use server';

    const email = String(formData.get('email') || '').trim().toLowerCase();
    const role = String(formData.get('role') || 'store_owner') as 'store_owner'|'cashier'|'admin';
    const storeId = String(formData.get('store_id') || '').trim();

    // preserve current qs on redirect
    const qs = new URLSearchParams({
      email,
      role,
      storeId,
    });

    if (!email) {
      redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent('Email is required')}`);
    }
    if ((role === 'store_owner' || role === 'cashier') && !storeId) {
      redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent('Pick a store for store roles')}`);
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const postLoginPath = role === 'admin' ? '/admin' : '/store';
    const redirectTo = `${base}/auth/callback?redirectTo=${encodeURIComponent(postLoginPath)}`;

    const admin = getAdminClient();

    const { data, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (inviteErr) {
      redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent(inviteErr.message)}`);
    }
    const invitedUser = data?.user;
    if (!invitedUser) {
      redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent('Invite sent, but no user payload returned')}`);
    }

    // set app_metadata.role
    const { error: updErr } = await admin.auth.admin.updateUserById(invitedUser.id, {
      app_metadata: { role },
    });
    if (updErr) {
      redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent(updErr.message)}`);
    }

    if (role === 'admin') {
      const username = email.split('@')[0];
      const { error: paErr } = await admin.from('platform_admins').insert({ user_id: invitedUser.id, username });
      if (paErr && paErr.code !== '23505') {
        redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent(paErr.message)}`);
      }
    } else {
      if (!storeId) {
        redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent('Store is required for store roles')}`);
      }
      if (role === 'store_owner') {
        const { error: owErr } = await admin.from('stores').update({ owner_user_id: invitedUser.id }).eq('id', storeId);
        if (owErr) {
          redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent(owErr.message)}`);
        }
      } else if (role === 'cashier') {
        const { error: suErr } = await admin.from('store_users').insert({ store_id: storeId, user_id: invitedUser.id, role: 'cashier' });
        if (suErr && suErr.code !== '23505') {
          redirect(`/admin/users/invite?${qs.toString()}&error=${encodeURIComponent(suErr.message)}`);
        }
      }
    }

    redirect(`/admin/users/invite?${qs.toString()}&ok=1`);
  }

  return (
    <div className="space-y-6 text-black">
      <h1 className="text-xl font-semibold">Invite user</h1>

      {ok && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Invitation sent to <b>{emailParam}</b>.
        </div>
      )}
      {!!errParam && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errParam}
        </div>
      )}

      <form action={inviteAction} className="grid max-w-xl gap-4 rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm text-gray-600">Email *</label>
          <input
            name="email"
            type="email"
            defaultValue={emailParam}
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Role *</label>
          <select
            name="role"
            defaultValue={roleParam}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="store_owner">Store Owner</option>
            <option value="cashier">Cashier</option>
            <option value="admin">Platform Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Store (for store roles)</label>
          <select
            name="store_id"
            defaultValue={storeParam}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="">— Select a store —</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? s.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Required for <b>Store Owner</b> or <b>Cashier</b>.
          </p>
        </div>

        <div className="pt-2">
          <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Send invite
          </button>
        </div>
      </form>
    </div>
  );
}

