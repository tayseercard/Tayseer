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
      className="relative flex flex-col gap-5 px-6 py-6 rounded-xl text-white shadow-md border border-(--c-accent)/30"
      style={{ backgroundColor: 'var(--c-primary)' }}
    >
      {/* === Top Row: Title + Actions === */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-(--c-accent)/20 text-(--c-accent)">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-wide">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* === Right-side Actions === */}
        <div className="flex items-center gap-2">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--c-accent) text-white text-sm font-medium hover:bg-[#c53e00] transition"
            >
              {a.icon}
              {a.label}
            </button>
          ))}
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-[var(--c-accent)] hover:text-white transition"
            >
              <Plus size={16} />
              Add
            </button>
          )}
        </div>
      </div>

      {/* === Bottom Row: User Info === */}
      {user && (
        <div className="flex items-center gap-4 border-t border-white/20 pt-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="User avatar"
              className="h-12 w-12 rounded-full object-cover border border-white/30"
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
            <p className="text-sm text-white/80">{user.email}</p>
            <p className="text-xs text-[var(--c-accent)] font-medium mt-0.5 uppercase tracking-wide">
              {user.role || 'Admin'}
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
