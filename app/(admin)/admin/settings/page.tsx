'use client'

import { useState } from 'react'
import {
  User,
  Lock,
  Bell,
  Moon,
  Info,
  HelpCircle,
  Trash2,
  ChevronRight,
  Globe2,
  Shield
} from 'lucide-react'
import SettingsHeader from '@/components/admin/settings/SettingsHeader'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-md space-y-6">
        {/* === Tayseer Header === */}
        <SettingsHeader
          title="Settings"
          subtitle="Manage your profile and preferences"
          user={{
            name: 'Omar Medjadj',
            email: 'omar@tayseer.dz',
            role: 'Admin',
            avatarUrl: '/icon-192-2.png',
          }}
          onLogout={handleLogout}
        />

        {/* === Profile Card === */}
       

        {/* === Section: Other Settings === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <SettingRow icon={<User />} label="Profile details" />
          <SettingRow icon={<Lock />} label="Password" />
          <SettingRow icon={<Globe2 />} label="Language" right="Français" />
          <SettingRow icon={<Shield />} label="Assign roles" />
          <SettingRow
            icon={<Moon />}
            label="Dark mode"
            toggle
            toggleValue={darkMode}
            onToggle={() => setDarkMode(!darkMode)}
          />
        </div>

        {/* === Section: App Info === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <SettingRow icon={<Info />} label="About application" />
          <SettingRow icon={<HelpCircle />} label="Help / FAQ" />
          <SettingRow
            icon={<Trash2 className="text-rose-500" />}
            label="Deactivate my account"
            labelClass="text-rose-600 font-medium"
          />
        </div>
      </div>
    </div>
  )
}

/* ---------------- Setting Row ---------------- */
function SettingRow({
  icon,
  label,
  right,
  toggle,
  toggleValue,
  onToggle,
  labelClass,
}: {
  icon: React.ReactNode
  label: string
  right?: string
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: () => void
  labelClass?: string
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="text-gray-600">{icon}</div>
        <span className={`text-sm ${labelClass ?? 'text-gray-800'}`}>{label}</span>
      </div>

      {toggle ? (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={toggleValue}
            onChange={onToggle}
          />
          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[var(--c-accent)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-4"></div>
        </label>
      ) : right ? (
        <span className="text-sm text-gray-500">{right}</span>
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </div>
  )
}
