'use client'

import { Menu } from '@headlessui/react'
import { Gift, Plus, RefreshCw, MoreVertical } from 'lucide-react'

export default function VoucherHeader({
  onAdd,
  onRefresh,
}: {
  onAdd: () => void
  onRefresh: () => void
}) {
  return (
    <header
      className="
        flex flex-col sm:flex-row sm:items-center justify-between gap-4
        px-5 py-4 rounded-2xl
        bg-gradient-to-b from-white/90 to-gray-50/80
        border border-gray-200/70 backdrop-blur-lg
        shadow-[0_4px_16px_rgba(0,0,0,0.04)]
      "
    >
      {/* === Left: Title === */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Vouchers
          </h1>
          <p className="text-sm text-gray-500">Create, manage, and track all store vouchers</p>
        </div>
      </div>

      {/* === Right: Desktop Actions === */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="
            flex items-center gap-2 rounded-lg border border-gray-200 
            bg-white px-3.5 py-2 text-sm text-gray-700 
            hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] 
            transition
          "
        >
          <RefreshCw className="h-4 w-4 opacity-70" />
          Refresh
        </button>

        <button
          onClick={onAdd}
          className="
            flex items-center gap-2 rounded-lg bg-emerald-600 text-white 
            px-4 py-2 text-sm font-medium 
            hover:bg-emerald-700 active:scale-[0.98] transition
          "
        >
          <Plus className="h-4 w-4" />
          New Voucher
        </button>
      </div>

      {/* === Right: Mobile Menu === */}
      <div className="sm:hidden">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button
            className="
              inline-flex items-center justify-center w-10 h-10 
              rounded-xl border border-gray-200 bg-white 
              hover:bg-gray-50 active:scale-95 transition
            "
          >
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </Menu.Button>

          <Menu.Items
            className="
              absolute right-0 mt-2 w-44 origin-top-right rounded-xl 
              border border-gray-100 bg-white/95 backdrop-blur-sm
              shadow-lg ring-1 ring-black/5 focus:outline-none
            "
          >
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onAdd}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm rounded-md ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <Plus className="h-4 w-4 text-emerald-600" /> New Voucher
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onRefresh}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm rounded-md ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4 text-gray-500" /> Refresh
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
