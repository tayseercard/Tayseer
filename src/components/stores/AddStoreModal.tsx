'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { randomBytes } from 'crypto';

export type AddStoreModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AddStoreModal({ open, onClose, onSuccess }: AddStoreModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wilaya, setWilaya] = useState<number | ''>('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null; // Don’t render when closed

  async function saveStore() {
    if (!name.trim() || !email.trim()) {
      alert('Name and email are required');
      return;
    }
    setSaving(true);

    try {
      // Generate temp password if not provided
      const pwd = password || randomBytes(4).toString('hex');

      // 1️⃣ Create Supabase Auth user (admin client)
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: pwd,
        email_confirm: true,
      });
      if (userError) throw userError;

      // 2️⃣ Insert store
      const { error: storeError } = await supabaseAdmin.from('stores').insert([
        {
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          email: email.trim(),
          wilaya: wilaya || null,
          owner_user_id: user.user.id,
          temp_password: pwd,
          temp_password_set: true,
        },
      ]);
      if (storeError) throw storeError;

      alert(`✅ Store created successfully.\nTemporary password: ${pwd}`);
      onSuccess?.();
      onClose();
    } catch (e: any) {
      alert('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Add Store</h2>
        <div className="space-y-3">
          <Input label="Name *" value={name} setValue={setName} />
          <Input label="Email *" value={email} setValue={setEmail} />
          <Input label="Phone" value={phone} setValue={setPhone} />
          <Input label="Address" value={address} setValue={setAddress} />
          <Input label="Wilaya" value={wilaya} setValue={setWilaya} type="number" />
          <Input label="Password (optional)" value={password} setValue={setPassword} />

          <button
            disabled={saving}
            onClick={saveStore}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Store'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, setValue, type = 'text' }: any) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-md p-2 text-sm"
      />
    </div>
  );
}
