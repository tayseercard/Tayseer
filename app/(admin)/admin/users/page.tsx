'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Shield,
  RefreshCw,
  Search,
  Trash2,
  UserCircle2,
  Store,
  UserCheck2,
  Mail,
  Clock,
  KeyRound,
  MoreVertical,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'

export default function AdminUsersPage() {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [groups, setGroups] = useState({
    admins: 0,
    managers: 0,
    cashiers: 0,
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')

      let admins: any[] = []
      let managers: any[] = []
      let cashiers: any[] = []
      let flat: any[] = []

      if (Array.isArray(data.users)) {
        flat = data.users
        admins = flat.filter((u) => u.role === 'admin')
        managers = flat.filter((u) => u.role === 'manager' || u.role === 'store_owner')
        cashiers = flat.filter((u) => u.role === 'cashier')
      } else {
        admins = data.admins || []
        managers = data.managers || []
        cashiers = data.cashiers || []
        flat = [...admins, ...managers, ...cashiers]
      }

      setGroups({
        admins: admins.length,
        managers: managers.length,
        cashiers: cashiers.length
      })
      setRows(flat)
    } catch (err: any) {
      toast.error(err.message || 'Error loading users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (u) =>
        (u.email ?? '').toLowerCase().includes(term) ||
        (u.role ?? '').toLowerCase().includes(term) ||
        (u.store_name ?? '').toLowerCase().includes(term) ||
        (u.store_temp_password ?? '').toLowerCase().includes(term) ||
        (u.cashier_full_name ?? '').toLowerCase().includes(term)
    )
  }, [rows, q])

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`Supprimer ${email} ? Cette action supprimera le rôle et le compte d'authentification.`)) return

    const loadingToast = toast.loading('Suppression en cours...')
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression')

      toast.success(`Utilisateur ${email} supprimé`, { id: loadingToast })
      await loadUsers()
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast })
    }
  }

  return (
    <div className="min-h-screen pb-20 space-y-8 animate-in fade-in duration-500">

      {/* Header & Stats Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#020035] tracking-tight flex items-center gap-3">
              <Shield className="h-7 w-7 text-[#ED4B00]" />
              Gestion des Utilisateurs
            </h1>
            <p className="text-gray-400 text-sm font-medium">Administrateurs, Gérants et Caissiers</p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 hover:text-[#020035] transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Administrateurs" count={groups.admins} icon={Shield} color="indigo" />
          <StatCard label="Gérants" count={groups.managers} icon={Store} color="emerald" />
          <StatCard label="Caissiers" count={groups.cashiers} icon={UserCircle2} color="rose" />
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-300 group-focus-within:text-[#ED4B00] transition-colors" />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par email, rôle, boutique..."
            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/2 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Data Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="h-10 w-10 border-4 border-gray-100 border-t-[#ED4B00] rounded-full animate-spin" />
          <p className="font-bold text-xs uppercase tracking-widest">Chargement des comptes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl shadow-indigo-900/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <Th>Utilisateur</Th>
                  <Th>Rôle</Th>
                  <Th>Boutique / Lieu</Th>
                  <Th>Accès</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {filtered.map((u) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={u.user_id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all font-bold text-sm">
                            {u.email?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#020035]">{u.email}</p>
                            <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                              <Clock size={10} /> {u.auth_created_at ? new Date(u.auth_created_at).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={u.role} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">{u.store_name || '—'}</span>
                          {u.cashier_full_name && (
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                              <UserCircle2 size={10} /> {u.cashier_full_name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {u.store_temp_password ? (
                          <div className="flex items-center gap-2 group/pass">
                            <div className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-bold border border-amber-100">
                              {u.store_temp_password}
                            </div>
                            <KeyRound size={12} className="text-amber-300 opacity-0 group-hover/pass:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 font-bold uppercase">Auth Standard</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {u.confirmed ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
                            <UserCheck2 size={12} />
                            Confirmé
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase tracking-tighter">
                            <Clock size={12} />
                            En attente
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(u.user_id, u.email)}
                          className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-300 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Cards */}
          <div className="lg:hidden grid gap-4 grid-cols-1 md:grid-cols-2">
            {filtered.map((u) => (
              <div
                key={u.user_id}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#020035] font-black text-sm border border-gray-100">
                      {u.email?.[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#020035] text-sm truncate max-w-[150px]">{u.email}</p>
                      <RoleBadge role={u.role} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(u.user_id, u.email)}
                    className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                  <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Boutique</p>
                    <p className="text-xs font-bold text-gray-700 truncate">{u.store_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Statut</p>
                    <p className={`text-xs font-bold ${u.confirmed ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {u.confirmed ? 'Confirmé' : 'En attente'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, count, icon: Icon, color }: { label: string; count: number; icon: any; color: 'indigo' | 'emerald' | 'rose' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100'
  }
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ring-1 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-[#020035] leading-none">{count}</p>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { bg: string, text: string, label: string }> = {
    admin: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', label: 'Admin' },
    superadmin: { bg: 'bg-[#020035] border-[#020035]', text: 'text-white', label: 'Super Admin' },
    manager: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Gérant' },
    store_owner: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Propriétaire' },
    cashier: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', label: 'Caissier' },
    user: { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-600', label: 'Utilisateur' },
  }
  const config = configs[role?.toLowerCase()] || configs.user
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ${className}`}>
      {children}
    </th>
  )
}
