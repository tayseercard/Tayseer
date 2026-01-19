'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CheckCircle2, Package, ShoppingCart, Loader2, ChevronDown } from 'lucide-react'

export default function PlanSettings({ t, storeId }: { t: any; storeId?: string }) {
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [plans, setPlans] = useState<any[]>([])
    const [selectedPlan, setSelectedPlan] = useState<any>(null)
    const [currentStore, setCurrentStore] = useState<any>(null)
    const [requestingId, setRequestingId] = useState<string | null>(null)
    const [sentIds, setSentIds] = useState<string[]>([])
    const [hasPendingRequest, setHasPendingRequest] = useState(false)

    useEffect(() => {
        loadData()
    }, [storeId])

    async function loadData() {
        setLoading(true)
        try {
            let targetStoreId = storeId

            // 1. Get current store ID if not provided
            if (!targetStoreId) {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                const { data: roleData } = await supabase
                    .from('me_effective_role')
                    .select('store_id')
                    .eq('user_id', session.user.id)
                    .maybeSingle()

                targetStoreId = roleData?.store_id
            }

            if (!targetStoreId) return

            const { data: store } = await supabase
                .from('stores')
                .select('*, plans(*)')
                .eq('id', targetStoreId)
                .single()

            setCurrentStore(store)

            // 2. Get all plans
            const { data: allPlans } = await supabase
                .from('plans')
                .select('*')
                .order('quantity', { ascending: true })

            setPlans(allPlans || [])
            if (allPlans && allPlans.length > 0) {
                setSelectedPlan(allPlans[0])
            }

            // 3. Check for pending requests
            const { data: pendingReq } = await supabase
                .from('voucher_requests')
                .select('id')
                .eq('store_id', targetStoreId)
                .eq('status', 'pending')
                .maybeSingle()

            if (pendingReq) setHasPendingRequest(true)

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleBuy(plan: any) {
        if (!confirm(`${t.confirm || 'Confirmer'} : ${plan.name} (${plan.total_price} DA)?`)) return

        setRequestingId(plan.id)
        try {
            const { error } = await supabase.from('voucher_requests').insert({
                store_id: currentStore.id,
                store_name: currentStore.name,
                count: plan.quantity,
                status: 'pending'
            })

            if (error) throw error

            setSentIds(prev => [...prev, plan.id])
            setHasPendingRequest(true) // Set pending request to true after a successful request

            alert(t.requestSent || 'Votre demande a été envoyée ! Un administrateur vous contactera pour le paiement.')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setRequestingId(null)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--c-accent)]" /></div>

    return (
        <div className="space-y-6">
            {/* Current Plan Card */}
            {currentStore?.plans && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#020035] to-[#02066F] text-white shadow-xl shadow-[#020035]/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                            <Package className="w-5 h-5 text-[var(--c-accent)]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.planInfo}</p>
                            <h3 className="text-lg font-black">{currentStore.plans.name}</h3>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-black">{currentStore.plans.quantity} <span className="text-sm font-normal opacity-70">QR Codes</span></p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${currentStore.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {currentStore.payment_status === 'paid' ? 'Actif' : 'En attente'}
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Request Alert */}
            {hasPendingRequest && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-amber-900 mb-1">Demande en cours</h3>
                        <p className="text-sm text-amber-700 max-w-xs mx-auto leading-relaxed">
                            Vous avez déjà une demande en attente. Un administrateur doit la valider avant que vous puissiez en effectuer une nouvelle.
                        </p>
                    </div>
                </div>
            )}

            {/* Plan Selector & Purchase */}
            {!hasPendingRequest && (
                <div className="bg-white border boundary-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="mb-6">
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">{t.selectPlan || 'Choix du pack'}</label>
                        <div className="relative">
                            <select
                                value={selectedPlan?.id || ''}
                                onChange={(e) => {
                                    const p = plans.find(x => x.id === e.target.value)
                                    setSelectedPlan(p)
                                }}
                                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[var(--c-accent)] focus:border-[var(--c-accent)] block p-3 pr-8 font-semibold cursor-pointer"
                            >
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.quantity} QRs)</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    {selectedPlan && (
                        <div className="space-y-6">
                            {/* Details */}
                            <div className="flex items-center justify-between text-sm bg-gray-50 p-4 rounded-xl">
                                <span className="text-gray-500">Prix unitaire</span>
                                <span className="font-medium text-gray-900">{selectedPlan.price_per_unit} DA/u</span>
                            </div>

                            {/* Total & Action */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Total</span>
                                    <span className="text-2xl font-black text-[var(--c-accent)]">
                                        {selectedPlan.total_price.toLocaleString()} DA
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleBuy(selectedPlan)}
                                    disabled={requestingId === selectedPlan.id || sentIds.includes(selectedPlan.id)}
                                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition active:scale-95 disabled:opacity-50 text-white ${sentIds.includes(selectedPlan.id)
                                        ? 'bg-emerald-500 hover:bg-emerald-600'
                                        : 'bg-gray-900 hover:bg-[var(--c-accent)]'
                                        }`}
                                >
                                    {requestingId === selectedPlan.id ? '...' : sentIds.includes(selectedPlan.id) ? 'Envoyé' : 'Commander'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
