'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { Users, Search, Phone, Gift, Calendar, Loader2 } from 'lucide-react'

export default function StoreClientsPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    // 🔹 Find store_id of this user
    const { data: roleRow } = await supabase
      .from('me_effective_role')
      .select('store_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleRow?.store_id) return setLoading(false)

    // 🔹 Fetch clients with voucher counts
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--c-text)] px-4 sm:px-6 md:px-10 py-8 space-y-8">
      {/* === Header === */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6 text-[var(--c-accent)]" />
            Clients
          </h1>
          <p className="text-sm text-[var(--c-text)]/70">
            All customers who purchased or received vouchers
          </p>
        </div>

        {/* 🔍 Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--c-text)]/40" />
          <input
            placeholder="Search clients..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--c-bank)]/30 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/30"
          />
        </div>
      </motion.header>

      {/* === Content === */}
      {loading ? (
        <div className="py-20 text-center text-[var(--c-text)]/50 text-sm">
          <Loader2 className="animate-spin inline-block mr-2 h-4 w-4" />
          Loading clients…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-[var(--c-text)]/60 text-sm">
          No clients found
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-[var(--c-bank)]/20 bg-white/80 backdrop-blur-sm p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[var(--c-primary)] truncate">
                  {c.full_name || 'Unnamed'}
                </h3>
                <span className="text-xs text-[var(--c-text)]/60 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Phone */}
              <div className="text-sm text-[var(--c-text)]/80 flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-[var(--c-accent)]" />
                {c.phone || '—'}
              </div>

              {/* Voucher Count */}
              <div className="text-sm font-medium flex items-center gap-2 text-[var(--c-primary)]">
                <Gift className="h-4 w-4 text-[var(--c-accent)]" />
                {c.vouchers_count || 0} voucher{c.vouchers_count > 1 ? 's' : ''}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
