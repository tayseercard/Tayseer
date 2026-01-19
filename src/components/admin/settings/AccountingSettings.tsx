'use client';

import { useState, useEffect } from 'react';
import { Coins, Loader2, ArrowUpRight } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/useLanguage';

type Payment = {
    id: string;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    stores: { name: string } | null;
    plans: { name: string; quantity: number } | null;
};

export default function AccountingSettings() {
    const { t, lang } = useLanguage();
    const supabase = createClientComponentClient();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    async function fetchPayments() {
        setLoading(true);
        const { data, error } = await supabase
            .from('payments')
            .select(`
                *,
                stores:store_id (name),
                plans:plan_id (name, quantity)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Failed to load payments');
            console.error(error);
        } else {
            // @ts-ignore
            setPayments(data || []);
        }
        setLoading(false);
    }

    const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'completed' ? Number(p.amount) : 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--c-primary)]">
                        <Coins className="h-5 w-5 text-[var(--c-accent)]" />
                        {t.accounting || 'Comptabilité'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {lang === 'ar' ? 'عرض مدفوعات اشتراك المتجر الأخيرة.' :
                            lang === 'fr' ? 'Afficher les paiements récents des abonnements.' :
                                'View recent store subscription payments.'}
                    </p>
                </div>
            </div>

            {/* --- Summary Card --- */}
            <div className="bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-secondary)] rounded-xl p-6 text-white shadow-lg">
                <p className="text-white/70 text-sm font-medium mb-1">{t.totalRevenue || 'Total Revenue'}</p>
                <h3 className="text-3xl font-bold">{totalRevenue.toLocaleString()} DA</h3>
            </div>

            {/* --- Payments List --- */}
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[var(--c-accent)]" /></div>
            ) : (
                <div className="space-y-3">
                    {payments.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{p.stores?.name || 'Unknown Store'}</p>
                                    <p className="text-xs text-gray-500">
                                        {p.plans?.name || 'Plan'} ({p.plans?.quantity} QR) • {new Date(p.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[var(--c-primary)]">{Number(p.amount).toLocaleString()} DA</p>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {p.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    {payments.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 text-sm">No payments recorded yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
