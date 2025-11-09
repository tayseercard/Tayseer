'use client'

export default function ProfileSettings({ t }: { t: Record<string, string> }) {
  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="text-gray-600">{t.fullName || 'Full Name'}</span>
        <input
          type="text"
          defaultValue="Djamil"
          className="mt-1 w-full border rounded-md p-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-gray-600">{t.email || 'Email'}</span>
        <input
          type="email"
          defaultValue="admin@tayseer.dz"
          className="mt-1 w-full border rounded-md p-2 text-sm"
        />
      </label>

      <button className="w-full mt-2 bg-[var(--c-accent)] text-white rounded-md py-2 text-sm font-medium hover:bg-[var(--c-accent)]/90">
        {t.save || 'Save Changes'}
      </button>
    </div>
  )
}
