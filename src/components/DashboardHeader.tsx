'use client'

import { Plus } from 'lucide-react'
import React from 'react'


export default function DashboardHeader({
  subtitle,
  icon,
  user,
  onAdd,
  actions = [],
  rightContent, // ⭐ now fully supported
}: {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  user?: { name: string; email: string; role?: string; avatarUrl?: string }
  onAdd?: () => void
  actions?: { label: string; onClick: () => void; icon?: React.ReactNode }[]
  rightContent?: React.ReactNode // ⭐ FIX: add this
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
      {/* === TOP ROW: Title + RightContent (like notifications) === */}
      <div className="flex items-center justify-between">
         {/* === BOTTOM ROW: USER INFO === */}
      {user && (
        <div className="flex items-center gap-3 pt-2">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="User avatar"
              className="h-12 w-12 rounded-full object-cover border border-white/20"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-[var(--c-accent)]/20 
              flex items-center justify-center text-[var(--c-accent)] 
              font-semibold text-lg">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <p className="text-base font-medium leading-tight text-white">
              {user.name}
            </p>
            <p className="text-sm text-white/70">{user.email}</p>
            <p className="text-xs text-[var(--c-accent)] font-medium mt-0.5 uppercase tracking-wide">
              {user.role || 'Admin'}
            </p>
          </div>
        </div>
      )}

        {/* ⭐ NotificationBell or any right content */}
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      </div>

     
    </header>
  )
}
