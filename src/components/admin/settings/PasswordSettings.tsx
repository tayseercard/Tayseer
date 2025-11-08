'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordSettings({ t }: { t: Record<string, string> }) {
  const supabase = createClientComponentClient()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordChange() {
    setMessage(null)

    if (!currentPassword || !newPassword || !confirmPassword)
      return setMessage('⚠️ Please fill in all fields.')
    if (newPassword.length < 6)
      return setMessage('⚠️ New password must be at least 6 characters.')
    if (newPassword !== confirmPassword)
      return setMessage('⚠️ Passwords do not match.')

    try {
      setLoading(true)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not found.')

      // 🔑 Step 1: Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })
      if (signInError) throw new Error('❌ Current password is incorrect.')

      // 🔁 Step 2: Update new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) throw updateError

      setMessage('✅ Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error('Error updating password:', err)
      setMessage(err.message || '❌ Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Current Password */}
      <label className="block relative">
        <span className="text-gray-600">Current Password</span>
        <input
          type={showCurrent ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1 w-full border rounded-md p-2 pr-10 text-sm"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShowCurrent(!showCurrent)}
          className="absolute right-2 top-[30px] text-gray-500 hover:text-gray-700"
        >
          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </label>

      {/* New Password */}
      <label className="block relative">
        <span className="text-gray-600">New Password</span>
        <input
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 w-full border rounded-md p-2 pr-10 text-sm"
          placeholder="Enter new password"
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-2 top-[30px] text-gray-500 hover:text-gray-700"
        >
          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </label>

      {/* Confirm New Password */}
      <label className="block relative">
        <span className="text-gray-600">Confirm New Password</span>
        <input
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full border rounded-md p-2 pr-10 text-sm"
          placeholder="Re-enter new password"
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-2 top-[30px] text-gray-500 hover:text-gray-700"
        >
          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </label>

      {message && (
        <p
          className={`text-xs text-center mt-2 ${
            message.startsWith('✅') ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {message}
        </p>
      )}

      <button
        onClick={handlePasswordChange}
        disabled={loading}
        className={`w-full mt-2 rounded-md py-2 text-sm font-medium transition
          ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-[var(--c-accent)] text-white hover:bg-[var(--c-accent)]/90'
          }
        `}
      >
        {loading ? 'Updating…' : 'Update Password'}
      </button>
    </div>
  )
}
