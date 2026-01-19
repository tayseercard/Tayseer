'use client'

import { LogOut } from 'lucide-react'
import React from 'react'

export default function SettingsHeader({
  title = 'Settings',
  subtitle,
  user,
  onLogout,
}: {
  title?: string
  subtitle?: string
  user?: { name: string; email: string; role?: string; avatarUrl?: string }
  onLogout?: () => void
}) {
  return (
    <header
      className="
        relative flex items-center justify-between 
        px-6 py-5 rounded-2xl
        border border-[var(--c-bank)]/25 
        bg-[var(--c-primary)] text-white shadow-md
        before:absolute before:inset-x-0 before:top-0 before:h-[4px]
      "
    >
      {/* === Bottom Row: User Info === */}
      {user && (
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-medium text-white leading-tight">
            {user.name}
          </p>
          <p className="text-sm text-white/70">{user.email}</p>
          <p className="text-xs text-[var(--c-accent)] font-medium mt-0.5 uppercase tracking-wide">
            {user.role || 'Admin'}
          </p>
        </div>
      )}
    </header>
  )
}
