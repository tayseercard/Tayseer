'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Phone,
  Gift,
  Loader2,
  TrendingUp,
  User as UserIcon,
  ChevronRight,
  X as LucideX
} from 'lucide-react'
import { useLanguage } from '@/lib/useLanguage'

export default function StoreClientsPage() {
  const supabase = createClientComponentClient()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [store, setStore] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // Load Store Info for Header
    const { data: storeRow } = await supabase
      .from('stores')
      .select('name, email, logo_url, phone, address')
      .eq('owner_user_id', session.user.id)
      .maybeSingle()

    if (storeRow) {
      setStore({
        name: storeRow.name,
        email: storeRow.email || session.user.email,
        role: 'Propriétaire',
        logoUrl: storeRow.logo_url,
        phone: storeRow.phone,
        address: storeRow.address
      })
    }

    const { data: roleRow } = await supabase
      .from('me_effective_role')
      .select('store_id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!roleRow?.store_id) return setLoading(false)

    // Fetch clients
    const { data, error } = await supabase
      .from('store_clients_with_vouchers')
      .select('*')
      .eq('store_id', roleRow.store_id)
      .order('created_at', { ascending: false })

    if (error) console.error('❌ Load clients error:', error.message)
    setClients(data || [])
    setLoading(false)
  }

  const filtered = clients.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(q.toLowerCase()) ||
      c.phone?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 pt-4 pb-20 space-y-3">



      {/* 🔍 Search Row */}
      <div className="flex flex-col md:flex-row items-center justify-end gap-4">

        <div className="relative w-full md:w-72 group">
          <div className="absolute inset-0 bg-[#020035]/5 blur-lg group-focus-within:bg-[#020035]/10 transition-colors pointer-events-none" />
          <div className="relative bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-xl flex items-center px-4 h-11 transition-all focus-within:ring-2 focus-within:ring-[#020035]/10">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#020035] transition-colors" />
            <input
              type="text"
              placeholder={t.searchPlaceholder || "Rechercher..."}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none px-3 text-xs font-bold text-gray-900 placeholder:text-gray-300"
            />
            {q && (
              <button onClick={() => setQ('')} className="p-1 rounded-full bg-gray-100 text-gray-400 hover:text-gray-900 transition">
                <LucideX size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📋 Grid Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#020035] mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
            <Search size={24} />
          </div>
          <p className="text-xs font-bold text-gray-400">Aucun client trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-white/70 backdrop-blur-sm border border-gray-100/60 rounded-2xl p-4 shadow-sm hover:bg-white hover:shadow-md transition-all active:scale-[0.98] cursor-default"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 truncate text-sm mb-2">
                      <span className="truncate">{c.full_name || 'Anonyme'}</span>
                    </h3>

                    <div className="space-y-1.5 pl-10">
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-[#020035] transition"
                      >
                        <Phone size={12} className="text-gray-300" />
                        {c.phone || '—'}
                      </a>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <TrendingUp size={12} className="text-emerald-500/50" />
                        Client depuis {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge kind="green">
                      {c.vouchers_count || 0} Voucher{c.vouchers_count > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function Badge({ children, kind }: { children: React.ReactNode, kind?: 'green' | 'amber' | 'rose' }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tight ${styles[kind || 'rose']}`}>
      {children}
    </span>
  )
}
