'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-3xl font-bold mb-2 text-red-600">🚫 Accès refusé</h1>
      <p className="text-gray-600 mb-6">
        Vous n'avez pas la permission de consulter cette page.
      </p>

      <button
        onClick={handleLogout}
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  )
}
