'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Combobox } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function StorePrintVouchersModal({
  open,
  onClose,
  stores,
}: {
  open: boolean
  onClose: () => void
  stores: { id: string; name: string }[]
}) {
  const supabase = createClientComponentClient()

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [isStoreUser, setIsStoreUser] = useState(false)

  /* 🧠 Detect user role and auto-select store */
  useEffect(() => {
    async function detectStore() {
      const { data: session } = await supabase.auth.getSession()
      const user = session.session?.user
      if (!user) return

      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('role, store_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!roleRow) return

      if (roleRow.role === 'store_owner' || roleRow.role === 'cashier') {
        setIsStoreUser(true)
        setSelectedStore(roleRow.store_id) // ⭐ auto-fill
      }
    }

    detectStore()
  }, [supabase])

  if (!open) return null

  const filteredStores =
    query === ''
      ? stores
      : stores.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-[var(--c-bank)]/20">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4 text-[var(--c-primary)]">
          Print Vouchers
        </h2>

        {/* ONLY ADMIN SEES STORE SELECTOR */}
        {!isStoreUser && (
          <div className="mb-4">
            <Combobox value={selectedStore} onChange={setSelectedStore}>
              <Combobox.Label className="text-sm text-gray-700 mb-1 block">
                Select Store
              </Combobox.Label>
              <div className="relative">
                <Combobox.Input
                  placeholder="Search store..."
                  className="w-full p-2 border rounded-md"
                  displayValue={(id: string) =>
                    stores.find((s) => s.id === id)?.name || ''
                  }
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Combobox.Options className="absolute mt-1 w-full rounded-md bg-white border shadow z-10 max-h-48 overflow-auto">
                  {filteredStores.length === 0 ? (
                    <div className="p-2 text-gray-500">No results</div>
                  ) : (
                    filteredStores.map((store) => (
                      <Combobox.Option
                        key={store.id}
                        value={store.id}
                        className={({ active }) =>
                          `cursor-pointer px-3 py-2 ${
                            active ? 'bg-emerald-100' : ''
                          }`
                        }
                      >
                        {store.name}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </div>
            </Combobox>
          </div>
        )}

        {/* Date inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700 block mb-1">From</label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">To</label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        {/* Print button */}
        <button
          onClick={() => {
            if (!selectedStore) return alert('Select a store.')
            if (!from || !to) return alert('Select both dates.')

            const url = `/store/vouchers/print/${selectedStore}?from=${from}&to=${to}`
            window.open(url, '_blank')
          }}
          className="mt-5 w-full bg-[var(--c-accent)] text-white p-2 rounded-md font-medium hover:bg-[var(--c-accent)]/90"
        >
          Print Vouchers
        </button>
      </div>
    </div>
  )
}
