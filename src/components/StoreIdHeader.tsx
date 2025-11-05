'use client';

import { ArrowLeft, QrCode, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { StoreRow } from '@/types/tables';


export default function StoreIdHeader({
  store,
  onAddVoucher,
}: {
    store?: StoreRow | null;  // ✅ full type
  onAddVoucher?: () => void;
  onScanQR?: () => void;
}) {
  const router = useRouter();

  return (
    <header className="relative flex flex-col gap-5 px-4 py-5 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm">
      {/* === Top Row: Back + Title === */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/stores')}
            className="flex items-center gap-1 text-gray-600 hover:text-black text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="text-xl font-semibold text-gray-900">
            {store?.name || 'Store Details'}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddVoucher}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-[0.98] transition"
          >
            <Plus className="h-4 w-4" /> Add Voucher
          </button>
        
        </div>
      </div>

      {/* === Store Info === */}
      {store && (
        <div className="text-sm text-gray-600 space-y-1 pl-7">
          <p>{store.address}</p>
          <p>
            {store.phone && <span>{store.phone}</span>}
            {store.phone && store.email && ' · '}
            {store.email && <span>{store.email}</span>}
          </p>
        </div>
      )}
    </header>
  );
}
