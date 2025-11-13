'use client'

import { Plus } from 'lucide-react'
import React from 'react'

export default function DashboardHeader({
  title = 'Dashboard',
  subtitle,
  icon,
  user,
  onAdd,
  actions = [],
}: {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  user?: { name: string; email: string; role?: string; avatarUrl?: string }
  onAdd?: () => void
  actions?: { label: string; onClick: () => void; icon?: React.ReactNode }[]
}) {
  return (
    <header
      className="
        relative flex flex-col gap-5 px-6 py-6
        rounded-2xl border border-[var(--c-bank)]/25 
        bg-[var(--c-primary)] text-white shadow-md
        before:absolute before:inset-x-0 before:top-0 before:h-[4px]
         before:rounded-t-2xl
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
        {user.role || 'Cashier'}
      </p>
    </div>
  </div>
)}

    </header>
  )
}
