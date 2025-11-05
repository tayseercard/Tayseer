'use client'

import { Menu } from '@headlessui/react'
import { Plus, MoreVertical } from 'lucide-react'
import React from 'react'

export default function DashboardHeader({
  title,
  icon,
  subtitle,
  onAdd,
  actions = [],
}: {
  title: string
  icon?: React.ReactNode
  subtitle?: string
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

      {/* === Right side: desktop actions === */}
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

      {/* === Mobile menu === */}
      <div className="sm:hidden">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
            <div className="py-1">
              {onAdd && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onAdd}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      <Plus className="h-4 w-4 text-emerald-600" /> Add
                    </button>
                  )}
                </Menu.Item>
              )}
              {actions.map((a, i) => (
                <Menu.Item key={i}>
                  {({ active }) => (
                    <button
                      onClick={a.onClick}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {a.icon}
                      {a.label}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  )
}
