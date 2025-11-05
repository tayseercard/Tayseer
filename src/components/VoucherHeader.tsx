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
    <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm">
      {/* === Left: Title === */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Vouchers</h1>
          <p className="text-sm text-gray-500">Manage, scan, and issue digital vouchers</p>
        </div>
      </div>

      {/* === Right: Desktop Actions === */}
      <div className="hidden sm:flex flex-wrap justify-end gap-2 sm:gap-3">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-sm font-medium rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow transition-all"
        >
          <RefreshCw className="h-4 w-4 text-gray-500" />
          Refresh
        </button>

        <button
          onClick={onScan}
          className="flex items-center gap-2 text-sm font-medium rounded-lg bg-emerald-600 text-white px-3.5 py-2 shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <QrCode className="h-4 w-4" />
          Scan
        </button>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 text-sm font-medium rounded-lg bg-blue-600 text-white px-3.5 py-2 shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* === Right: Mobile Dropdown === */}
      <div className="sm:hidden">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onAdd}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <Plus className="h-4 w-4 text-blue-600" /> Add Vouchers
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onScan}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <QrCode className="h-4 w-4 text-emerald-600" /> Scan QR
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onRefresh}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
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
