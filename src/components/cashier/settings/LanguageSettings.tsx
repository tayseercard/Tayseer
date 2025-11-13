'use client'

import { useLanguage, LangCode } from '@/lib/useLanguage'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const LANGUAGES = [
  { label: 'English 🇬🇧', code: 'en' },
  { label: 'Français 🇫🇷', code: 'fr' },
  { label: 'العربية 🇩🇿', code: 'ar' },
]

export default function LanguageSettings({
  onLanguageChanged,
}: {
  onLanguageChanged?: () => void
}) {
  const { lang, setLang, t } = useLanguage()
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleChangeLanguage(code: LangCode) {
    if (lang === code) return
    setLoading(true)

    try {
      await supabase.auth.updateUser({ data: { lang: code } })
      setLang(code)

      // Trigger router refresh and callback
      router.refresh()
      onLanguageChanged?.()

      setMessage(
        '✅ ' +
          (code === 'ar'
            ? 'تم حفظ اللغة بنجاح'
            : code === 'fr'
            ? 'Langue enregistrée'
            : 'Language saved')
      )
    } catch (e) {
      console.error(e)
      setMessage(
        '❌ ' +
          (code === 'ar'
            ? 'حدث خطأ أثناء الحفظ'
            : code === 'fr'
            ? 'Erreur lors de l’enregistrement'
            : 'Error saving language')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-gray-600">{t.chooseLang}</p>

      <div className="space-y-2">
        {LANGUAGES.map((lng) => (
          <button
            key={lng.code}
            disabled={loading}
            onClick={() => handleChangeLanguage(lng.code as LangCode)}
            className={`w-full text-left border rounded-md p-2 transition ${
              lang === lng.code
                ? 'bg-[var(--c-accent)]/10 border-[var(--c-accent)] text-[var(--c-accent)] font-medium'
                : 'hover:bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            {lng.label}
          </button>
        ))}
      </div>

      {message && (
        <p
          className={`text-xs mt-2 text-center ${
            message.startsWith('✅') ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
