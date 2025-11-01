'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
export default function TestSupabase() {
  const [message, setMessage] = useState('Testing...');

  useEffect(() => {
    async function checkConnection() {
      try {
        // simple ping: get your auth user (anonymous request)
        const { data, error } = await supabase.from('merchants').select('*').limit(1);
        if (error) throw error;

        setMessage(`✅ Connected! Found ${data.length} merchants (or table accessible).`);
      } catch (err: any) {
        console.error('Supabase test error:', err.message);
        setMessage(`❌ Connection failed: ${err.message}`);
      }
    }
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center text-center p-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Supabase Connection Test</h1>
        <p className="text-lg">{message}</p>
      </div>
    </div>
  );
}
