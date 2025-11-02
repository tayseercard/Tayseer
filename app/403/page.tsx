'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ForbiddenPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="mt-auto p-4 border-t border-gray-100">
  <div className="text-xs text-gray-500 mb-2">
    Logged in as <span className="font-medium text-gray-700">{/* email or name */}</span>
  </div>
  <button
    onClick={handleLogout}
    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
  >
    <LogOut size={16} /> Logout
  </button>
</div>
  )
}
