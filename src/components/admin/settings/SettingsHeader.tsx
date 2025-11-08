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
  <div className="flex items-center gap-4">
    {user.avatarUrl ? (
      <img
        src={user.avatarUrl}
        alt="User avatar"
        className="h-12 w-12 rounded-full object-cover border border-white/20"
      />
    ) : (
      <div className="h-12 w-12 rounded-full bg-[var(--c-accent)]/20 flex items-center justify-center text-[var(--c-accent)] font-semibold text-lg">
        {user.name?.[0]?.toUpperCase() || 'U'}
      </div>
    )}

    <div>
      <p className="text-base font-medium text-white leading-tight">
        {user.name}
      </p>
      <p className="text-sm text-white/70">{user.email}</p>
      <p className="text-xs text-[var(--c-accent)] font-medium mt-0.5 uppercase tracking-wide">
        {user.role || 'Admin'}
      </p>
    </div>
  </div>
)}

      {/* === Right side: Logout === */}
     

      <button
        onClick={onLogout}
        className="
          flex items-center justify-center
          w-10 h-10 sm:w-11 sm:h-11
          rounded-full
          bg-[var(--c-accent)] text-white
          shadow-md hover:bg-[var(--c-accent)]/90
          active:scale-95 transition
        "
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  )
}
