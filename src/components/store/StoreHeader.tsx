'use client'

import React from 'react'
import { Phone, MapPin } from 'lucide-react'

export default function StoreHeader({
  subtitle,
  icon,
  store,
  onAdd,
  onRefresh,
  actions = [],
  rightContent,
}: {
  subtitle?: string
  icon?: React.ReactNode
  store?: {
    name: string
    email?: string
    phone?: string
    address?: string
    role?: string
    logoUrl?: string
  }
  onAdd?: () => void
  onRefresh?: () => void
  actions?: { label: string; onClick: () => void; icon?: React.ReactNode }[]
  rightContent?: React.ReactNode
}) {
  return (
    <header
      className="
        relative flex flex-col gap-6 px-6 py-6
        rounded-2xl border border-[var(--c-bank)]/25 
        bg-[var(--c-primary)] text-white shadow-lg
        overflow-hidden
        before:absolute before:inset-x-0 before:top-0 before:h-[4px]
        before:bg-[var(--c-accent)] before:rounded-t-2xl
      "
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left: Store Branding */}
        {store && (
          <div className="flex items-start sm:items-center gap-4">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt="Store logo"
                className="h-16 w-16 rounded-xl object-cover border-2 border-white/20 shadow-sm shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center text-[var(--c-accent)] font-black text-xl border border-white/10 shrink-0">
                {store.name?.[0]?.toUpperCase() || 'S'}
              </div>
            )}

            <div className="min-w-0 space-y-1.5 transition-all">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xl font-black leading-tight text-white tracking-tight truncate">
                  {store.name}
                </p>
                {store.role && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[var(--c-accent)] text-[8px] font-black uppercase tracking-[0.12em] shadow-sm">
                    {store.role}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {(store.phone || store.address) ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {store.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50">
                        <Phone size={12} className="text-[var(--c-accent)]/70" />
                        {store.phone}
                      </div>
                    )}
                    {store.address && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 max-w-[200px] sm:max-w-[300px] truncate">
                        <MapPin size={12} className="text-[var(--c-accent)]/70" />
                        {store.address}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/60 font-medium truncate">
                    {subtitle || store.email || 'Tableau de bord'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right: Notification Bell etc. */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {icon}
          {rightContent}
        </div>
      </div>
    </header>
  )
}
