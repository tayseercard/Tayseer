'use client'

import { Plus, RefreshCw } from 'lucide-react'
import React from 'react'

export default function StoreHeader({
  title = 'Store Dashboard',
  subtitle,
  icon,
  store,
  onAdd,
  onRefresh,
  actions = [],
}: {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  store?: {
    name: string
    email?: string
    role?: string
    logoUrl?: string
  }
  onAdd?: () => void
  onRefresh?: () => void
  actions?: { label: string; onClick: () => void; icon?: React.ReactNode }[]
}) {
  return (
    <header
      className="
        relative flex flex-col gap-5 px-6 py-6
        rounded-2xl border border-[var(--c-bank)]/25 
        bg-[var(--c-primary)] text-white shadow-md
        before:absolute before:inset-x-0 before:top-0 before:h-[4px]
        before:bg-[var(--c-accent)] before:rounded-t-2xl
      "
    >
      {/* === Top Row: Title + Actions === */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        
        <div className="flex items-center gap-2 flex-wrap">
        
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium transition"
            >
              {a.icon}
              {a.label}
            </button>
          ))}

          {onAdd && (
            <button
              onClick={onAdd}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-md
                bg-[var(--c-accent)] text-white text-sm font-medium
                hover:bg-[var(--c-accent)]/90 active:scale-95 transition
              "
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* === Bottom Row: Store Info === */}
      {store && (
        <div className="flex items-center gap-4">
          {/* Avatar / Logo */}
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt="Store logo"
              className="h-12 w-12 rounded-full object-cover border border-white/20 shadow-sm"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-[var(--c-accent)] font-semibold text-lg">
              {store.name?.[0]?.toUpperCase() || 'S'}
            </div>
          )}

          {/* Store Details */}
          <div>
            <p className="text-base font-medium text-white leading-tight">
              {store.name}
            </p>
            {store.email && (
              <p className="text-sm text-white/70">{store.email}</p>
            )}
            {store.role && (
              <p className="text-xs text-[var(--c-accent)] font-medium mt-0.5 uppercase tracking-wide">
                {store.role}
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
