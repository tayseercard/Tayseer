'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Loader2, History } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/useLanguage'

export default function CashierHistoryPage() {
    const { t } = useLanguage()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(true)
    const [vouchers, setVouchers] = useState<any[]>([])

    useEffect(() => {
        ; (async () => {
            setLoading(true)
            const { data: sessionData } = await supabase.auth.getSession()
            const user = sessionData.session?.user
            if (!user) return

            // Get store ID
            const { data: roleRow } = await supabase
                .from('me_effective_role')
                .select('store_id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (!roleRow?.store_id) {
                setLoading(false)
                return
            }

            // Fetch history
            const { data } = await supabase
                .from('vouchers')
                .select('*')
                .eq('store_id', roleRow.store_id)
                .eq('activated_by', user.id)
                .order('activated_at', { ascending: false })

            if (data) {
                setVouchers(data)
            }
            setLoading(false)
        })()
    }, [supabase])

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--c-text)] px-4 sm:px-6 md:px-10 py-8 pb-20 space-y-6">

            {/* Header */}
            <header className="flex items-center gap-4">
                <Link href="/cashier" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-[var(--c-primary)] flex items-center gap-2">
                        <History className="h-5 w-5 text-[var(--c-accent)]" />
                        Activation History
                    </h1>
                    <p className="text-sm text-gray-500">
                        {loading ? 'Loading...' : `${vouchers.length} activated vouchers`}
                    </p>
                </div>
            </header>

            {/* Content */}
            {loading ? (
                <div className="py-20 text-center text-gray-400 flex justify-center items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading history...
                </div>
            ) : vouchers.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-gray-400 italic">No history found.</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Mobile View */}
                    <div className="grid gap-3 sm:hidden">
                        {vouchers.map((v) => (
                            <div key={v.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-[var(--c-accent)]/20 group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{v.buyer_name || 'Unknown'}</h3>
                                        {v.recipient_name && (
                                            <p className="text-xs text-gray-500 mt-0.5">For: {v.recipient_name}</p>
                                        )}
                                    </div>
                                    <StatusBadge status={v.status} />
                                </div>

                                <div className="space-y-2 text-xs text-gray-500 pt-3 border-t border-gray-50">
                                    <div className="flex justify-between">
                                        <span>Phone:</span>
                                        <span className="font-medium text-gray-700">{v.buyer_phone || '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Activated:</span>
                                        <span className="font-medium text-gray-700">
                                            {v.activated_at
                                                ? new Date(v.activated_at).toLocaleDateString() + ' ' + new Date(v.activated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span>Value:</span>
                                        <span className="font-black text-[var(--c-primary)] text-sm">{v.balance} DA</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Buyer</th>
                                    <th className="px-6 py-4">Recipient</th>
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Activated</th>
                                    <th className="px-6 py-4 text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {vouchers.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-6 py-4 font-bold text-gray-900">{v.buyer_name || '—'}</td>
                                        <td className="px-6 py-4 text-gray-700">{v.recipient_name || '—'}</td>
                                        <td className="px-6 py-4 text-gray-500">{v.buyer_phone || '—'}</td>
                                        <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {v.activated_at
                                                ? new Date(v.activated_at).toLocaleDateString() + ' ' + new Date(v.activated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-[var(--c-primary)]">{v.balance} DA</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        redeemed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
        blank: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        expired: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200',
        void: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
    }

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[status as keyof typeof styles] || styles.blank}`}>
            {status}
        </span>
    )
}
