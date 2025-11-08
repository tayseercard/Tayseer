'use client'
import { useEffect, useState } from 'react'
import { translations } from './translations' // your big dictionary file
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type LangCode = 'en' | 'fr' | 'ar'

export function useLanguage() {
  const supabase = createClientComponentClient()
  const [lang, setLangState] = useState<LangCode>('fr') // default
  const [t, setT] = useState(translations.fr)

  // 🔹 Load language from localStorage or Supabase user metadata
  useEffect(() => {
    ;(async () => {
      const saved = localStorage.getItem('lang') as LangCode | null
      if (saved) {
        setLangState(saved)
        setT(translations[saved])
        return
      }

      const { data } = await supabase.auth.getUser()
      const userLang = (data.user?.user_metadata?.lang as LangCode) || 'fr'
      setLangState(userLang)
      setT(translations[userLang])
      localStorage.setItem('lang', userLang)
    })()
  }, [supabase])

  // 🔹 Setter function (updates both localStorage & state)
  const setLang = (newLang: LangCode) => {
    setLangState(newLang)
    setT(translations[newLang])
    localStorage.setItem('lang', newLang)
  }

  // 🔹 Return translation dictionary
  return { lang, t, setLang }
}
