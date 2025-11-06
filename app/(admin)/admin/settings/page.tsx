'use client'

import { useState } from 'react'
import StoresPasswordList from './StoresPasswordList'

export default function SettingsPage({ stores }: { stores: any[] }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'stores'>('stores')

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--c-text)] px-4 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* === Page Title === */}
        <header>
          <h1 className="text-xl font-semibold text-[var(--c-primary)]">Settings</h1>
          <p className="text-sm text-[var(--c-text)]/70">
            Manage admin preferences and system access
          </p>
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
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'roles' && <RolesSettings />}
          {activeTab === 'stores' && <StoresPasswordList stores={stores} />}
        </div>
      </div>
    </div>
  )
}

/* Placeholder subcomponents */
function ProfileSettings() {
  return <p className="text-sm text-[var(--c-text)]/70">Profile settings coming soon…</p>
}
function RolesSettings() {
  return <p className="text-sm text-[var(--c-text)]/70">Role management section…</p>
}
