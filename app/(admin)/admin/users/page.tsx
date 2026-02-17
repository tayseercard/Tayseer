'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  RefreshCw,
  Search,
  Trash2,
  UserCircle2,
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
import Image from 'next/image'

export default function AdminUsersPage() {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selectedRole, setSelectedRole] = useState<'all' | string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(8)
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

      let flat: any[] = []
      if (Array.isArray(data.users)) {
        flat = data.users
      } else {
        flat = [...(data.admins || []), ...(data.managers || []), ...(data.cashiers || [])]
      }

      setGroups({
        admins: flat.filter((u) => u.role === 'admin').length,
        managers: flat.filter((u) => u.role === 'manager' || u.role === 'store_owner').length,
        cashiers: flat.filter((u) => u.role === 'cashier').length
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
    let data = [...rows]

    // Role filter
    if (selectedRole !== 'all') {
      if (selectedRole === 'managers') {
        data = data.filter(u => u.role === 'manager' || u.role === 'store_owner')
      } else {
        data = data.filter(u => u.role === selectedRole)
      }
    }

    // Search term
    const term = q.trim().toLowerCase()
    if (term) {
      data = data.filter(
        (u) =>
          (u.email ?? '').toLowerCase().includes(term) ||
          (u.role ?? '').toLowerCase().includes(term) ||
          (u.store_name ?? '').toLowerCase().includes(term) ||
          (u.store_temp_password ?? '').toLowerCase().includes(term) ||
          (u.cashier_full_name ?? '').toLowerCase().includes(term)
      )
    }
    return data
  }, [rows, q, selectedRole])

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [q, selectedRole])

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
    <div className="min-h-screen pb-20 space-y-4 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#020035] tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-400 text-sm font-medium">Administrateurs, Gérants et Caissiers</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 text-gray-400 font-bold text-xs hover:bg-gray-50 hover:text-[#020035] transition-all active:scale-95 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Role Tabs Row */}
      <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto scrollbar-hide shrink-0">
        {[
          { key: 'all', label: 'Tous', count: rows.length },
          { key: 'admin', label: 'Admins', count: groups.admins },
          { key: 'managers', label: 'Gérants', count: groups.managers },
          { key: 'cashier', label: 'Caissiers', count: groups.cashiers },
        ].map((rt) => (
          <button
            key={rt.key}
            onClick={() => setSelectedRole(rt.key)}
            className={`flex items-center gap-1.5 pt-4 pb-2 px-3 text-xs font-bold transition-all relative whitespace-nowrap ${selectedRole === rt.key ? 'text-[#020035]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span>{rt.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedRole === rt.key ? 'bg-[#020035] text-white' : 'bg-gray-100 text-gray-500'}`}>
              {rt.count}
            </span>
            {selectedRole === rt.key && (
              <motion.div layoutId="userRoleUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#020035]" />
            )}
          </button>
        ))}

        <div className="ml-auto pr-2 pb-2 pt-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-all ${showFilters ? 'bg-[#020035] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-gray-100 p-3 shadow-sm shrink-0"
        >
          <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl px-4 py-2 border border-gray-100 h-11 transition-all group focus-within:bg-white focus-within:shadow-inner">
            <Search className="h-4 w-4 text-gray-300 group-focus-within:text-[#020035] transition-colors" />
            <input
              value={q}
              autoFocus
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par email, rôle, boutique..."
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder:text-gray-300"
            />
            {q && (
              <button onClick={() => setQ('')} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-all">
                <RefreshCw size={12} className="rotate-45" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Data Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="h-10 w-10 border-4 border-gray-100 border-t-[#020035] rounded-full animate-spin" />
          <p className="font-bold text-[10px] uppercase tracking-widest text-[#020035] bg-[#020035]/5 px-4 py-1.5 rounded-full">Chargement en cours...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
          <UserCircle2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                  {paginated.map((u) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={u.user_id}
                      className="group hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all font-bold text-sm overflow-hidden relative border border-gray-50">
                            {u.avatar_url || u.store_logo_url ? (
                              <Image src={u.avatar_url || u.store_logo_url} alt={u.email} fill className="object-cover" />
                            ) : (
                              u.email?.[0].toUpperCase()
                            )}
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
                            <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-mono text-[10px] font-bold border border-amber-100">
                              {u.store_temp_password}
                            </div>
                            <KeyRound size={12} className="text-amber-300 opacity-0 group-hover/pass:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tight bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Standard</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {u.confirmed ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-black text-[10px] uppercase tracking-tighter w-fit">
                            <UserCheck2 size={12} />
                            Confirmé
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 font-black text-[10px] uppercase tracking-tighter w-fit">
                            <Clock size={12} />
                            En attente
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(u.user_id, u.email); }}
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

          {/* Mobile Cards */}
          <div className="lg:hidden grid gap-4 grid-cols-1 md:grid-cols-2">
            {paginated.map((u) => (
              <div
                key={u.user_id}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-[#020035] font-black text-sm border border-gray-100 overflow-hidden relative">
                      {u.avatar_url || u.store_logo_url ? (
                        <Image src={u.avatar_url || u.store_logo_url} alt={u.email} fill className="object-cover" />
                      ) : (
                        u.email?.[0].toUpperCase()
                      )}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-[#020035] disabled:opacity-30 transition-all active:scale-95 shadow-sm"
              >
                <RefreshCw className="h-3 w-3 rotate-180" />
              </button>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-[#020035] bg-[#020035]/5 px-2.5 py-1 rounded-md">
                  PAGE {currentPage} <span className="text-gray-300 mx-1">/</span> {totalPages}
                </span>
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-[#020035] disabled:opacity-30 transition-all active:scale-95 shadow-sm"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${config.bg} ${config.text}`}>
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
