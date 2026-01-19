'use client'

import { Plus, Printer, Store as StoreIcon, MoreHorizontal, Power, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export default function StoreIdHeader({
  store,
  onAddVoucher,
  onPrintVouchers,
  onToggleStatus,
}: {
  store?: any | null
  onAddVoucher?: () => void
  onPrintVouchers?: () => void
  onToggleStatus?: () => void
}) {
  const router = useRouter()

  return (
    <header className="relative rounded-2xl bg-gray-900 p-5 shadow-sm z-40">
      {/* 🌫️ Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] -mr-24 -mt-24" />
      </div>

      {/* ⚙️ More Actions Menu */}
      <div className="absolute top-5 right-5 z-50">
        <Menu as="div" className="relative">
          <Menu.Button className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition active:scale-95">
            <MoreHorizontal className="h-5 w-5" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right divide-y divide-white/5 rounded-xl bg-gray-800 border border-white/10 shadow-xl focus:outline-none z-[100]">
              <div className="px-1 py-1">
                {onAddVoucher && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onAddVoucher}
                        className={`
                          ${active ? 'bg-white/10 text-white' : 'text-white/70'}
                          group flex w-full items-center rounded-lg px-3 py-2 text-[11px] font-bold transition
                        `}
                      >
                        <Plus className="mr-2 h-4 w-4 text-[var(--c-accent)]" />
                        Nouveau Voucher
                      </button>
                    )}
                  </Menu.Item>
                )}
                {onPrintVouchers && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onPrintVouchers}
                        className={`
                          ${active ? 'bg-white/10 text-white' : 'text-white/70'}
                          group flex w-full items-center rounded-lg px-3 py-2 text-[11px] font-bold transition
                        `}
                      >
                        <Printer className="mr-2 h-4 w-4 text-white/40" />
                        Imprimer QR Codes
                      </button>
                    )}
                  </Menu.Item>
                )}
              </div>

              {onToggleStatus && (
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onToggleStatus}
                        className={`
                          ${active ? 'bg-white/10' : ''}
                          ${store?.status === 'open' ? 'text-rose-400' : 'text-emerald-400'}
                          group flex w-full items-center rounded-lg px-3 py-2 text-[11px] font-bold transition
                        `}
                      >
                        {store?.status === 'open' ? (
                          <>
                            <Power className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                            Désactiver la Boutique
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                            Activer la Boutique
                          </>
                        )}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <div className="relative z-10 pr-12">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
            <StoreIcon className="w-5 h-5 text-[var(--c-accent)]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              {store?.name || 'Détails Boutique'}
            </h1>
          </div>
        </div>
      </div>
    </header>
  )
}
