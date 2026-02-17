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

      <div className="relative flex flex-row items-start justify-between gap-4">
        {/* Left: Store Branding */}
        {store && (
          <div className="flex-1 min-w-0 flex items-start gap-4">

            {/* Store Avatar */}
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full border border-white/20 bg-white/10 overflow-hidden relative shadow-inner">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white/20">{store.name.charAt(0)}</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5 transition-all">
              <div className="flex flex-wrap items-start gap-2 pr-2">
                <p className="text-lg font-black leading-tight text-white tracking-tight line-clamp-2 break-words">
                  {store.name}
                </p>
                {store.role && (
                  <span className="mt-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[var(--c-accent)] text-[8px] font-black uppercase tracking-[0.12em] shadow-sm shrink-0">
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
        <div className="flex items-center gap-3 shrink-0 -mt-2">
          {icon}
          {rightContent}
        </div>
      </div>
    </header>
  )
}
