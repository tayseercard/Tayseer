'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, User, Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export default function StoreTeamPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  // State
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ email: '' })

  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)

  /** =============================
   *  LOAD LOGGED USER ROLE + STORE
   * ============================= */
  useEffect(() => {
    ; (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return

      const { data: me } = await supabase
        .from('me_effective_role')
        .select('role, store_id, store_name')
        .eq('user_id', user.id)
        .maybeSingle()

      setRole(me?.role || null)
      setStoreId(me?.store_id || null)
      setStoreName(me?.store_name || null)
      setOwnerEmail(user.email || null)
    })()
  }, [supabase])

  /** Block cashiers from entering */
  useEffect(() => {
    if (role === 'cashier') router.push('/store/vouchers')
  }, [role, router])

  /** =============================
   *  LOAD TEAM + MERGE CASHIERS
   * ============================= */
  async function loadTeam() {
    if (!storeId) return
    setLoading(true)

    try {
      const res = await fetch('/api/store/team')
      if (!res.ok) throw new Error('Failed to fetch team')
      const data = await res.json()
      setTeam(data.team || [])
    } catch (err: any) {
      console.error('Error loading team:', err)
      // Fallback or empty state
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [storeId])

  /** =============================
   *  ADD CASHIER
   * ============================= */
  async function handleAddCashier() {
    if (!form.email.trim()) return alert('❌ Please enter an email.')

    setSaving(true)
    try {
      const res = await fetch('/api/store/add-cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          store_id: storeId,
          store_name: storeName,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      alert('✅ Invitation sent!')
      setForm({ email: '' })
      setOpen(false)
      loadTeam()
    } catch (err: any) {
      alert('❌ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  /** =============================
   *  REMOVE TEAM MEMBER
   * ============================= */
  async function removeMember(member: any) {
    if (!confirm('❌ Remove this team member?')) return

    try {
      const res = await fetch('/api/store/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: member.user_id,
          store_id: storeId,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      alert('🗑️ Member removed')
      loadTeam()
    } catch (err: any) {
      alert('❌ ' + err.message)
    }
  }

  /** =============================
   *  UI
   * ============================= */
  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-white via-gray-50 to-emerald-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--c-accent)]" />
            Store Team
          </h1>

          {storeName && (
            <p className="text-sm text-gray-500 mt-1">
              {storeName} — {ownerEmail}
            </p>
          )}
        </div>

        {role === 'store_owner' && (
          <Button
            onClick={() => setOpen(true)}
            className="bg-[var(--c-accent)] text-white flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </div>

      {/* Team List */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading...
        </div>
      ) : team.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No team members yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              {/* Name */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800 truncate">
                  {m.full_name || m.email}
                </h3>

                <Badge>
                  {m.role}
                </Badge>
              </div>

              {/* Email */}
              <p className="text-xs text-gray-600 mb-1">
                {m.email}
              </p>

              {/* Joined date */}
              <p className="text-xs text-gray-500 mb-3">
                Joined: {new Date(m.created_at).toLocaleDateString()}
              </p>

              {/* Remove button */}
              {role === 'store_owner' && m.role !== 'store_owner' && (
                <Button
                  onClick={() => removeMember(m)}
                  variant="destructive"
                  size="sm"
                  className="w-full flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Cashier */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle>Add Cashier</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ email: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCashier}
              disabled={saving}
              className="bg-[var(--c-accent)] text-white"
            >
              {saving ? 'Sending…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
