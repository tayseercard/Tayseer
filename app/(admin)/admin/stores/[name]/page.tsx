'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  Search,
  Printer,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Plus,
  Power,
  Trash2,
  Store as StoreIcon
} from 'lucide-react'
import Image from 'next/image'
import { v4 as uuidv4 } from 'uuid'
import PrintVouchersModal from '@/components/PrintVouchersModal'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/useLanguage'
import { wilayaLabel } from '@/lib/algeria'
import { usePageTitle } from '@/lib/PageTitleContext'

type StoreRow = {
  id: string
  name: string | null
  address: string | null
  phone: string | null
  email: string | null
  wilaya: number | null
  status: 'open' | 'inactive' | 'closed'
  created_at: string | null
  paid_at: string | null
  logo_url?: string | null
  payment_status?: 'paid' | 'unpaid'
  plans?: {
    id: string
    name: string
    quantity: number
    price_per_unit: number
    total_price: number
  } | null
}

type VoucherRow = {
  id: string
  code: string
  buyer_name: string | null
  buyer_phone?: string | null
  initial_amount: number
  balance: number
  status: 'blank' | 'active' | 'redeemed' | 'expired' | 'void'
  expires_at: string | null
  activated_at?: string | null
  created_at: string
}

export default function AdminStoreDetailPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { name } = useParams<{ name: string }>()
  const { t } = useLanguage()
  const { setTitle } = usePageTitle()

  const [store, setStore] = useState<StoreRow | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [loadingStore, setLoadingStore] = useState(true)
  const [loadingVouchers, setLoadingVouchers] = useState(true)
  const [q, setQ] = useState('')
  const [printModal, setPrintModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [countToAdd, setCountToAdd] = useState(1)
  const [addingLoading, setAddingLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8
  const [storeId, setStoreId] = useState<string | null>(null)
  const [activeInfoTab, setActiveInfoTab] = useState<'contact' | 'location'>('contact')

  const loadStore = useCallback(async () => {
    if (!name) return
    setLoadingStore(true)
    try {
      const decodedParam = decodeURIComponent(name)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedParam)

      let query = supabase.from('stores').select('*, plans(*)')

      if (isUUID) {
        query = query.or(`id.eq.${decodedParam},name.eq.${decodedParam}`)
      } else {
        query = query.eq('name', decodedParam)
      }

      const { data, error } = await query.maybeSingle()

      if (error || !data) {
        router.replace('/admin/stores')
        return
      }

      if (Array.isArray(data.plans)) {
        data.plans = data.plans[0] || null
      }
      setStore(data)
      setStoreId(data.id)
      setTitle(data.name)

      const { data: payData } = await supabase
        .from('payments')
        .select('*, plans(name)')
        .eq('store_id', data.id)
        .order('created_at', { ascending: false })

      if (payData) setPayments(payData)

    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStore(false)
    }
  }, [name, supabase, router, setTitle])

  const loadVouchers = useCallback(async () => {
    if (!storeId) return
    setLoadingVouchers(true)
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (!error && data) setVouchers(data as VoucherRow[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingVouchers(false)
    }
  }, [storeId, supabase])

  useEffect(() => {
    loadStore()
    loadVouchers()
  }, [loadStore, loadVouchers])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return vouchers
    return vouchers.filter(
      (v) =>
        (v.code ?? '').toLowerCase().includes(term) ||
        (v.buyer_name ?? '').toLowerCase().includes(term)
    )
  }, [vouchers, q])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1

  useEffect(() => {
    setCurrentPage(1)
  }, [q])

  async function createBlankVouchers() {
    if (!storeId || countToAdd < 1) return
    setAddingLoading(true)
    try {
      const rows = Array.from({ length: countToAdd }).map(() => ({
        store_id: storeId,
        code: 'MKD-' + uuidv4().split('-')[0].toUpperCase(),
        status: 'blank',
        initial_amount: 0,
        balance: 0,
      }))

      const { error } = await supabase.from('vouchers').insert(rows)
      if (error) throw error

      alert(`✅ Created ${countToAdd} blank voucher(s)`)
      setAdding(false)
      setCountToAdd(1)
      loadVouchers()
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    } finally {
      setAddingLoading(false)
    }
  }

  async function handleToggleStatus() {
    if (!store) return
    const newStatus = store.status === 'open' ? 'inactive' : 'open'
    const confirmMsg = newStatus === 'open'
      ? "Activer cette boutique ?"
      : "Désactiver cette boutique ?"

    if (!confirm(confirmMsg)) return

    try {
      const { error } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', storeId)

      if (error) throw error
      setStore({ ...store, status: newStatus })
    } catch (err: any) {
      alert("Erreur: " + err.message)
    }
  }

  async function handleMarkAsPaid() {
    if (!store) return
    if (!confirm("Confirmer le paiement ?")) return

    try {
      const amount = store.plans?.total_price || 0
      const { error: payError } = await supabase.from('payments').insert({
        store_id: store.id,
        amount: amount,
        plan_id: store.plans?.id,
        status: 'completed',
        payment_method: 'cash'
      })

      if (payError) throw payError

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', store.id)

      if (updateError) throw updateError

      const now = new Date().toISOString()
      setStore({
        ...store,
        payment_status: 'paid',
        paid_at: now
      })

      // Refresh payments list
      setPayments(prev => [{ created_at: now, amount: amount, plans: { name: store.plans?.name } }, ...prev])

      // 3️⃣ Auto-generate vouchers if this is the first payment
      if (store.plans && vouchers.length === 0) {
        const count = store.plans.quantity
        const rows = Array.from({ length: count }).map(() => ({
          store_id: store.id,
          code: 'MKD-' + uuidv4().split('-')[0].toUpperCase(),
          status: 'blank',
          initial_amount: 0,
          balance: 0,
        }))

        const { error: vouchersError } = await supabase.from('vouchers').insert(rows)
        if (vouchersError) throw vouchersError

        loadVouchers()
        alert(`Paiement enregistré et ${count} vouchers générés automatiquement !`)
      } else {
        alert('Paiement enregistré !')
      }

      loadStore()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDeleteStore() {
    if (!store) return
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer définitivement cette boutique ? Cette action est irréversible.")) return

    const confirm2 = confirm("Confirmez-vous la suppression de TOUTES les données liées à cette boutique ?")
    if (!confirm2) return

    try {
      const res = await fetch('/api/admin/delete-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression')

      alert("✅ Boutique supprimée avec succès")
      router.replace('/admin/stores')
    } catch (err: any) {
      alert("❌ Erreur: " + err.message)
    }
  }

  if (loadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-accent)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <div className="mx-auto max-w-4xl p-4 sm:p-5 space-y-5">

        {/* 1. Name, Status and Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 shrink-0 rounded-full border border-gray-100 bg-gray-50 overflow-hidden relative">
                {store?.logo_url ? (
                  <Image src={store.logo_url} alt={store.name ?? ''} fill className="object-cover" />
                ) : (
                  <StoreIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-gray-900 leading-tight truncate">{store?.name}</h2>
                <p className="text-xs text-gray-400 font-medium truncate mt-0.5">ID: {store?.id.slice(0, 8)}</p>
              </div>
            </div>

            {/* ⚙️ More Actions Menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition active:scale-95">
                <MoreHorizontal className="h-5 w-5" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right divide-y divide-gray-50 rounded-xl bg-white border border-gray-200 shadow-xl focus:outline-none z-[100]">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setAdding(true)}
                          className={`
                            ${active ? 'bg-gray-50 text-[#020035]' : 'text-gray-600'}
                            group flex w-full items-center rounded-lg px-3 py-2 text-[11px] font-bold transition
                          `}
                        >
                          <Plus className="mr-2 h-4 w-4 text-[#ed4b00]" />
                          Nouveau Voucher
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setPrintModal(true)}
                          className={`
                            ${active ? 'bg-gray-50 text-[#020035]' : 'text-gray-600'}
                            group flex w-full items-center rounded-lg px-3 py-2 text-[11px] font-bold transition
                          `}
                        >
                          <Printer className="mr-2 h-4 w-4 text-gray-400" />
                          Imprimer QR Codes
                        </button>
                      )}
                    </Menu.Item>
                  </div>

                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleToggleStatus}
                          className={`
                            ${active ? 'bg-gray-50' : ''}
                            ${store?.status === 'open' ? 'text-rose-500' : 'text-emerald-600'}
                            group flex w-full items-center rounded-lg px-3 py-2 text-[11px] font-bold transition
                          `}
                        >
                          {store?.status === 'open' ? (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Désactiver la Boutique
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Activer la Boutique
                            </>
                          )}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleDeleteStore}
                          className={`
                            ${active ? 'bg-rose-50 text-rose-700' : 'text-rose-500'}
                            group flex w-full items-center rounded-lg px-3 py-2 text-[11px] font-bold transition
                          `}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer le Compte
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          <div className="flex gap-2">
            <Badge kind={store?.status === 'open' ? 'green' : 'amber'}>
              {store?.status === 'open' ? 'Boutique active' : 'En attente d\'activation'}
            </Badge>
            <Badge kind={store?.payment_status === 'paid' ? 'green' : 'rose'}>
              {store?.payment_status === 'paid' ? 'Plan payé' : 'Paiement requis'}
            </Badge>
          </div>
        </div>

        {/* 2. Coordonnées (Moved under name/status) */}
        {/* 2. Coordonnées (Left/Right Split) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

            {/* Left Column: Contact */}
            <div className="space-y-6">
              <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest mb-2 opacity-50">Contact</h3>
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-[#020035]" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-gray-300 uppercase">Email</p>
                  <p className="text-sm font-bold text-gray-700 truncate">{store?.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-[#020035]" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-gray-300 uppercase">Téléphone</p>
                  <p className="text-sm font-bold text-gray-700">{store?.phone || '—'}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Location/Info */}
            <div className="space-y-6">
              <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest mb-2 opacity-50">Localisation</h3>
              <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-[#020035]" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-gray-300 uppercase">Wilaya</p>
                  <p className="text-sm font-bold text-gray-700">{wilayaLabel(store?.wilaya)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-[#020035]" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-gray-300 uppercase">Inscrit le</p>
                  <p className="text-sm font-bold text-gray-700">
                    {store?.created_at ? new Date(store.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-4 border-t border-gray-50 flex items-start gap-4">
            <MapPin className="w-5 h-5 text-[#020035] mt-1 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Adresse Complète</p>
              <p className="text-xs text-gray-500 font-medium italic leading-relaxed">
                {store?.address || 'Aucune adresse renseignée.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* LEFT: Liste des Vouchers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                <Printer className="w-4 h-4 text-gray-400" />
                Liste des Vouchers
              </h3>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filtrer..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loadingVouchers ? (
                <div className="py-20 text-center text-gray-400 text-xs">Chargement...</div>
              ) : paginated.length === 0 ? (
                <div className="py-20 text-center text-gray-400 text-xs font-medium">Aucun résultat trouvé.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase">
                      <th className="px-5 py-3 text-left">Bénéficiaire</th>
                      <th className="px-5 py-3 text-left">Code</th>
                      <th className="px-5 py-3 text-left">Statut</th>
                      <th className="px-5 py-3 text-right">Solde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/30 transition">
                        <td className="px-5 py-3 font-bold text-gray-700">{v.buyer_name || '—'}</td>
                        <td className="px-5 py-3"><span className="font-mono text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black">{v.code}</span></td>
                        <td className="px-5 py-3"><StatusPill status={v.status} /></td>
                        <td className="px-5 py-3 text-right font-black text-gray-600">{fmtDZD(v.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!loadingVouchers && totalPages > 1 && (
              <div className="p-4 border-t border-gray-50 flex items-center justify-center gap-3">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-[10px] font-black text-gray-400">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* RIGHT: Historique des Paiements */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Historique des Paiements</h3>

              <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50">
                <table className="w-full text-[10px]">
                  <thead className="bg-gray-100/50 text-gray-400 font-black uppercase tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Plan / Pack</th>
                      <th className="px-4 py-2 text-center">Montant</th>
                      <th className="px-4 py-2 text-right">Date de Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white/40">
                    {payments.length === 0 ? (
                      <tr className="text-gray-400 italic">
                        <td className="px-4 py-3 text-xs font-bold">{store?.plans?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-center font-bold">
                          {store?.plans ? fmtDZD(store.plans.total_price) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-rose-400 font-black italic">En attente</span>
                        </td>
                      </tr>
                    ) : (
                      payments.map((p, idx) => (
                        <tr key={idx} className="text-gray-700 font-bold">
                          <td className="px-4 py-3 text-xs font-black">{p.plans?.name || store?.plans?.name || 'Pack'}</td>
                          <td className="px-4 py-3 text-center text-[#020035] font-black">
                            {fmtDZD(p.amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase font-black text-[9px] whitespace-nowrap">
                              {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {store?.payment_status !== 'paid' && (
                  <button
                    onClick={handleMarkAsPaid}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-[#020035] text-white rounded-xl text-xs font-bold hover:bg-black transition active:scale-95 shadow-lg shadow-gray-200"
                  >
                    <CreditCard className="w-4 h-4" />
                    Valider le Paiement
                  </button>
                )}

                {store?.payment_status === 'paid' && store?.status !== 'open' && (
                  <button
                    onClick={handleToggleStatus}
                    className="col-span-full h-11 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Activer la Boutique
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {store && (
          <PrintVouchersModal
            open={printModal}
            onClose={() => setPrintModal(false)}
            stores={[{ id: store.id, name: store.name ?? '' }]}
          />
        )}

        {adding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-lg font-black text-gray-900 leading-tight mb-1">Vouchers</h2>
              <p className="text-[10px] text-gray-400 font-bold mb-5">Générer des codes vides.</p>

              <div className="space-y-4">
                <input
                  type="number"
                  min={1}
                  value={countToAdd}
                  onChange={(e) => setCountToAdd(parseInt(e.target.value))}
                  className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-black text-gray-900 focus:outline-none focus:border-[var(--c-accent)] transition"
                />
                <div className="flex gap-2">
                  <button onClick={() => setAdding(false)} className="flex-1 h-11 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Annuler</button>
                  <button
                    disabled={addingLoading}
                    onClick={createBlankVouchers}
                    className="flex-[2] h-11 bg-[var(--c-accent)] text-white rounded-xl text-xs font-bold px-6 shadow-sm disabled:opacity-50"
                  >
                    {addingLoading ? '...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Danger Zone */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest mb-1">Zone de Danger</h3>
                <p className="text-xs text-gray-400 font-medium">Une fois supprimée, cette boutique et ses données ne pourront plus être récupérées.</p>
              </div>
              <button
                onClick={handleDeleteStore}
                className="h-10 px-6 flex items-center justify-center gap-2 bg-white text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold hover:bg-rose-50 transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: VoucherRow['status'] }) {
  const map: Record<string, { label: string, color: string }> = {
    active: { label: 'Actif', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    redeemed: { label: 'Utilisé', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    expired: { label: 'Expiré', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    void: { label: 'Annulé', color: 'bg-rose-50 text-rose-600 border-rose-100' },
    blank: { label: 'Vide', color: 'bg-gray-50 text-gray-300 border-gray-100' },
  }
  const config = map[status] || map.blank
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border leading-none ${config.color}`}>
      {config.label}
    </span>
  )
}

function fmtDZD(n: number) {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(n)
}
