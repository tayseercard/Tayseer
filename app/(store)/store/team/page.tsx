'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, User, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function StoreTeamPage() {
  const supabase = createClientComponentClient()
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ email: '', name: '' })
  const [storeId, setStoreId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  // 🧠 Load user role + store_id
  useEffect(() => {
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      const user = session?.user
      if (!user) return

      // Fetch role and store_id from me_effective_role
      const { data: me } = await supabase
        .from('me_effective_role')
        .select('role, store_id')
        .eq('user_id', user.id)
        .maybeSingle()

      setRole(me?.role || null)
      setStoreId(me?.store_id || null)
    })()
  }, [supabase])

  // 🧾 Load team members
  useEffect(() => {
    if (!storeId) return
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('me_effective_role')
        .select('id, user_id, role, created_at, store_name, user_id')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
      if (error) console.error('Load team error:', error)
      setTeam(data || [])
      setLoading(false)
    })()
  }, [storeId, supabase])

  // ➕ Add cashier
 async function handleAddCashier() {
  if (!form.email.trim() || !storeId) return alert('Email is required.')

  setSaving(true)
  try {
    const res = await fetch('/api/store/add-cashier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.trim(),
        store_id: storeId,
        store_name: 'Your Store Name', // optional — can add dynamic name if you store it
      }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to add cashier')

    alert('✅ Invitation sent! The cashier will receive an email to join.')
    setForm({ email: '', name: '' })
    setOpen(false)

    // Refresh team list
    const { data } = await supabase
      .from('me_effective_role')
      .select('id, user_id, role, created_at, store_name')
      .eq('store_id', storeId)
    setTeam(data || [])
  } catch (err: any) {
    alert('❌ ' + err.message)
  } finally {
    setSaving(false)
  }
}



  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          Store Team
        </h1>

        {role === 'store_owner' && (
          <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-1" /> Add Cashier
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading team...
        </div>
      ) : team.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No team members yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800 truncate">
                  {m.user_id.slice(0, 6)}…{m.user_id.slice(-4)}
                </span>
                <Badge
                  kind={
                    m.role === 'store_owner'
                      ? 'green'
                      : m.role === 'cashier'
                      ? 'blue'
                      : 'gray'
                  }
                >
                  {m.role}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Joined: {new Date(m.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Cashier Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur rounded-2xl border border-emerald-100 shadow-lg">
          <DialogHeader>
            <DialogTitle>Add Cashier</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Input
              placeholder="Cashier Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCashier} disabled={saving} className="bg-emerald-600 text-white">
              {saving ? 'Adding…' : 'Add Cashier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

