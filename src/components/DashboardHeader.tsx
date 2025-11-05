'use client'

import { Menu } from '@headlessui/react'
import { Plus, MoreVertical, User } from 'lucide-react'
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
    <header className="relative flex items-center justify-between px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm">
      {/* === Left side === */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* === Right side === */}
      <div className="flex items-center gap-3">
        {/* Actions (Settings, Refresh, etc.) */}
        <div className="hidden sm:flex items-center gap-2">
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
        </div>

        {/* Optional Add Button */}
        {onAdd && (
          <button
            onClick={onAdd}
            className="hidden sm:flex items-center justify-center h-9 w-9 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
            title="Add new"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}

        {/* User Menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm hover:bg-gray-50 transition-all">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User Avatar"
                className="h-8 w-8 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User className="h-4 w-4" />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role || 'Administrator'}
              </p>
            </div>
            <MoreVertical className="h-4 w-4 text-gray-500 ml-1" />
          </Menu.Button>

          {/* Dropdown Menu */}
          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none divide-y divide-gray-100">
            <div className="px-4 py-3 text-sm text-gray-700">
              <p className="font-medium">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'admin@tayseer.app'}</p>
              <p className="text-xs mt-1 text-emerald-600">{user?.role || 'Admin'}</p>
            </div>

            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => alert('Profile page')}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    View Profile
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => alert('Logging out...')}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    Log out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  )
}
