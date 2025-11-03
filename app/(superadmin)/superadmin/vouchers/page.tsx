'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Search,
  Filter,
  Trash2,
  QrCode,
  Building2,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SuperadminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadVouchers() {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/list-vouchers');
      const { vouchers, error } = await res.json();
      if (error) throw new Error(error);
      setVouchers(vouchers || []);
      setFiltered(vouchers || []);
    } catch (err) {
      console.error('❌ Error loading vouchers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, []);

  // 🔍 Filter vouchers
  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (!term) setFiltered(vouchers);
    else {
      setFiltered(
        vouchers.filter(
          (v) =>
            (v.code ?? '').toLowerCase().includes(term) ||
            (v.buyer_name ?? '').toLowerCase().includes(term) ||
            (v.stores?.name ?? '').toLowerCase().includes(term)
        )
      );
    }
  }, [q, vouchers]);

  async function handleDeleteVoucher(id: string, code: string) {
    if (!confirm(`Delete voucher ${code}?`)) return;
    try {
      const res = await fetch('/api/admin/delete-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete voucher');
      alert(`🗑️ Deleted voucher ${code}`);
      await loadVouchers();
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  }

  return (
    <div className="flex flex-col gap-5 text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-indigo-600" />
          <h1 className="text-xl font-semibold">All Vouchers</h1>
        </div>
        <Button variant="outline" onClick={loadVouchers}>
          Reload
        </Button>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-sm p-2 rounded-xl border flex items-center gap-2 shadow-sm">
        <Search className="h-4 w-4 text-gray-400 ml-1" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search voucher by code, buyer, or store..."
          className="flex-1 border-none bg-transparent text-sm focus:outline-none"
        />
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" /> Filter
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-sm">
          Loading vouchers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500 text-sm">
          No vouchers found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th>Amount</Th>
                <Th>Buyer</Th>
                <Th>Store</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <Td className="font-mono text-xs">{v.code}</Td>
                  <Td>
                    <Badge
                      kind={
                        v.status === 'active'
                          ? 'green'
                          : v.status === 'redeemed'
                          ? 'blue'
                          : 'gray'
                      }
                    >
                      {v.status}
                    </Badge>
                  </Td>
                  <Td>{v.amount ?? '—'}</Td>
                  <Td>{v.buyer_name ?? '—'}</Td>
                  <Td className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    {v.stores?.name ?? '—'}
                  </Td>
                  <Td className="text-xs text-gray-500">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {new Date(v.created_at).toLocaleDateString()}
                  </Td>
                  <Td className="flex items-center gap-2">
                    <Link
                      href={`/superadmin/vouchers/${v.id}`}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteVoucher(v.id, v.code)}
                      className="text-rose-600 text-xs hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Subcomponents ---------- */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
