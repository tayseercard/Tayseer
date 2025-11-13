'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ProfileSettings({ t }: { t: Record<string, string> }) {
  const supabase = createClientComponentClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // 🔥 Load real user info
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      if (!user) return

      setEmail(user.email || '')
      setFullName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          '' // fallback
      )
    })()
  }, [supabase])

  // 💾 Save changes
  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({
      email,
      data: { full_name: fullName },
    })

    setSaving(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(t.saved || 'Saved successfully!')
    }
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Full Name */}
      <label className="block">
        <span className="text-gray-600">{t.fullName || 'Full Name'}</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full border rounded-md p-2 text-sm"
          placeholder={t.fullName || 'Full Name'}
        />
      </label>

      {/* Email */}
      <label className="block">
        <span className="text-gray-600">{t.email || 'Email'}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border rounded-md p-2 text-sm"
          placeholder="you@example.com"
        />
      </label>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-2 bg-[var(--c-accent)] text-white rounded-md py-2 text-sm font-medium hover:bg-[var(--c-accent)]/90 disabled:opacity-60"
      >
        {saving ? t.saving || 'Saving…' : t.save || 'Save Changes'}
      </button>

      {/* Status Message */}
      {message && (
        <p className="text-center text-xs text-emerald-600 mt-2">{message}</p>
      )}
    </div>
  )
}
