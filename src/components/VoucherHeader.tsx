'use client'

import { Menu } from '@headlessui/react'
import { Gift, QrCode, Plus, RefreshCw, MoreVertical } from 'lucide-react'

export default function VoucherHeader({
  onAdd,
  onScan,
  onRefresh,
}: {
  onAdd: () => void
  onScan: () => void
  onRefresh: () => void
}) {
  return (
    <header className="
      flex flex-col sm:flex-row sm:items-center justify-between gap-4
      px-4 py-4 rounded-2xl border border-gray-200/70
      bg-white/60 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]
    ">
      {/* === Left: Title === */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900">
            Vouchers
          </h1>
          <p className="text-sm text-gray-500">Issue and manage digital cards</p>
        </div>
      </div>

      {/* === Right: Desktop Actions === */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
        >
          <RefreshCw className="h-4 w-4 opacity-70" />
          Refresh
        </button>

        <button
          onClick={onScan}
          className="flex items-center gap-2 rounded-lg bg-gray-900 text-white px-3 py-2 text-sm hover:bg-gray-800 active:scale-[0.98] transition"
        >
          <QrCode className="h-4 w-4 opacity-90" />
          Scan
        </button>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700 active:scale-[0.98] transition"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* === Right: Mobile Dropdown === */}
      <div className="sm:hidden">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="
            inline-flex items-center justify-center w-10 h-10 rounded-xl
            border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition
          ">
            <MoreVertical className="h-5 w-5 text-gray-700" />
          </Menu.Button>

          <Menu.Items className="
            absolute right-0 mt-2 w-44 origin-top-right rounded-xl
            border border-gray-100 bg-white/95 backdrop-blur-sm
            shadow-lg ring-1 ring-black/5 focus:outline-none
          ">
            <div className="py-1">
              {[
                { label: 'New Voucher', icon: Plus, action: onAdd, color: 'text-emerald-600' },
                { label: 'Scan QR', icon: QrCode, action: onScan, color: 'text-gray-800' },
                { label: 'Refresh', icon: RefreshCw, action: onRefresh, color: 'text-gray-500' },
              ].map(({ label, icon: Icon, action, color }) => (
                <Menu.Item key={label}>
                  {({ active }) => (
                    <button
                      onClick={action}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm rounded-md ${
                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                      {label}
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
