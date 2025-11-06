'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import StoresPasswordList from './StoresPasswordList'

export default function SettingsPage({ stores }: { stores: any[] }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'stores'>('stores')
  const supabase = createClientComponentClient()
  const router = useRouter()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) alert('❌ Logout failed: ' + error.message)
    else router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--c-text)] px-4 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* === Page Title === */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--c-primary)]">Settings</h1>
            <p className="text-sm text-[var(--c-text)]/70">
              Manage admin preferences and system access
            </p>
          </div>

          {/* 🔒 Logout Button */}
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-2 rounded-lg border border-[var(--c-bank)]/30
              px-3 py-2 text-sm text-[var(--c-bank)] font-medium
              hover:bg-[var(--c-bank)] hover:text-white transition-all
            "
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        {/* === Horizontal Tabs === */}
        <nav className="flex gap-3 overflow-x-auto border-b border-[var(--c-bank)]/20 pb-2">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'roles', label: 'Roles' },
            { key: 'stores', label: 'Stores Access' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
                ${
                  activeTab === tab.key
                    ? 'bg-[var(--c-accent)] text-white shadow-sm'
                    : 'text-[var(--c-text)]/70 hover:bg-[var(--c-primary)]/10'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* === Active Content === */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--c-bank)]/10 p-4 sm:p-6">
          {activeTab === 'profile' && <ProfileSettings onLogout={handleLogout} />}
          {activeTab === 'roles' && <RolesSettings />}
          {activeTab === 'stores' && <StoresPasswordList stores={stores} />}
        </div>
      </div>
    </div>
  )
}

/* Placeholder subcomponents */
function ProfileSettings({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
      <p className="text-sm text-[var(--c-text)]/70">Profile settings coming soon…</p>
      <button
        onClick={onLogout}
        className="mt-3 sm:mt-0 flex items-center gap-2 rounded-lg border border-[var(--c-bank)]/30
          px-3 py-2 text-sm text-[var(--c-bank)] hover:bg-[var(--c-bank)] hover:text-white transition-all"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  )
}

function RolesSettings() {
  return <p className="text-sm text-[var(--c-text)]/70">Role management section…</p>
}
