'use client'

import { Plus } from 'lucide-react'
import React from 'react'

export default function StoreHeader({
  subtitle,
  icon,
  store,
  onAdd,
  onRefresh,
  actions = [],
  rightContent,     // ⭐ ADDED
}: {
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
  rightContent?: React.ReactNode  // ⭐ ADDED
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

      {/* === Top Row: Title + RightContent === */}
      <div className="flex items-center justify-between">
        {/* Left: Title */}

        {/* === Bottom Row: Store Info === */}
      {store && (
        <div className="flex items-center gap-4 pt-2">
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

          <div>
            <p className="text-base font-medium leading-tight text-white">
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
        <div className="flex items-center gap-3">
          {icon}
          <div>
            {subtitle && (
              <p className="text-sm text-white/70">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: NOTIFICATION BELL */}
        <div className="flex items-center gap-3">
          {rightContent}
        </div>
      </div>

      
    </header>
  )
}
