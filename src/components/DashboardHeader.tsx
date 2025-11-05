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
      {/* === Top Row: Title + Actions === */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions (top right) */}
        <div className="flex items-center gap-2">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className="flex items-center gap-2 text-sm font-medium rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
            >
              {a.icon}
              {a.label}
            </button>
          ))}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
              title="Add new"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

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
