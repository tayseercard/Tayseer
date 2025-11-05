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
    <header className="relative flex flex-col gap-5 px-4 py-5 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm">
     

      {/* === Bottom Row: User Info === */}
      {user && (
        <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="User avatar"
              className="h-12 w-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-lg">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <p className="text-base font-medium text-gray-800 leading-tight">
              {user.name}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5 uppercase tracking-wide">
              {user.role || 'Admin'}
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
