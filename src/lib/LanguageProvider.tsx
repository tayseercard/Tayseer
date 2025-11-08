'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type LangCode = 'en' | 'fr' | 'ar'
type LangContextType = {
  lang: LangCode
  t: typeof translations['en']
  setLang: (lang: LangCode) => void
}

const LangContext = createContext<LangContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const [lang, setLangState] = useState<LangCode>('fr')
  const [t, setT] = useState(translations.fr)

  // Load language from localStorage or Supabase metadata
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

  // When language changes, update translations and localStorage
  const setLang = (newLang: LangCode) => {
    setLangState(newLang)
    setT(translations[newLang])
    localStorage.setItem('lang', newLang)
  }

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
