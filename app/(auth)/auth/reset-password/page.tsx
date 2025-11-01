'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setMessage(`❌ ${error.message}`);
    else setMessage('✅ Password updated successfully! You can now log in.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleUpdate}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md grid gap-4"
      >
        <h1 className="text-lg font-semibold text-center text-gray-800">
          Set a new password
        </h1>

        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 text-white rounded-md py-2 font-medium hover:bg-emerald-700 transition"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>

        {message && (
          <p className="text-sm text-center text-gray-600 mt-2">{message}</p>
        )}
      </form>
    </div>
  );
}
