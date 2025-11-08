'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type LangCode = 'en' | 'fr' | 'ar'

const translations: Record<LangCode, Record<string, string>> = {
  en: {
    settings: 'Settings',
    profile: 'Profile',
    password: 'Password',
    language: 'Language',
    roles: 'Roles',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    save: 'Save',
    confirm: 'Confirm',
    cancel: 'Cancel',
    chooseLang: 'Choose your preferred language:',
    managePref: 'Manage your profile and preferences',
    dashboard: 'Dashboard',
    stores: 'Stores',
    vouchers: 'Vouchers',
    users: 'Users',
    back: 'Back',
    // Add to each language object
totalRegistered: 'Total registered',
allVouchers: 'All vouchers',
active: 'Active',
redeemed: 'Redeemed',
currentlyActive: 'Currently active',
usedVouchers: 'Used vouchers',
latestStores: 'Latest Stores',
recentVouchers: 'Recent Vouchers',
topStores: 'Top Performing Stores',
noStores: 'No stores yet.',
noVouchers: 'No vouchers yet.',
noActiveVouchers: 'No active vouchers found.',
viewAll: 'View all',


  },
  fr: {
    viewAll: 'Voir tout',
    settings: 'Paramètres',
    profile: 'Profil',
    password: 'Mot de passe',
    language: 'Langue',
    roles: 'Rôles',
    logout: 'Se déconnecter',
    darkMode: 'Mode sombre',
    save: 'Enregistrer',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    chooseLang: 'Choisissez votre langue préférée :',
    managePref: 'Gérez votre profil et vos préférences',
    dashboard: 'Tableau de bord',
    stores: 'Magasins',
    vouchers: 'Bons',
    users: 'Utilisateurs',
    back: 'Retour',
    // 🇫🇷 French
totalRegistered: 'Nombre total',
allVouchers: 'Tous les bons',
active: 'Actifs',
redeemed: 'Utilisés',
currentlyActive: 'Actuellement actifs',
usedVouchers: 'Bons utilisés',
latestStores: 'Derniers magasins',
recentVouchers: 'Bons récents',
topStores: 'Magasins les plus performants',
noStores: 'Aucun magasin trouvé.',
noVouchers: 'Aucun bon trouvé.',
noActiveVouchers: 'Aucun bon actif trouvé.',


  },
  ar: {
    viewAll: 'عرض الكل',

    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    password: 'كلمة المرور',
    language: 'اللغة',
    roles: 'الأدوار',
    logout: 'تسجيل الخروج',
    darkMode: 'الوضع الليلي',
    save: 'حفظ',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    chooseLang: 'اختر لغتك المفضلة:',
    managePref: 'قم بإدارة ملفك وإعداداتك الشخصية',
    dashboard: 'لوحة التحكم',
    stores: 'المتاجر',
    vouchers: 'القسائم',
    users: 'المستخدمون',
    back: 'رجوع',
    // 🇩🇿 Arabic
totalRegistered: 'إجمالي المسجلين',
allVouchers: 'كل القسائم',
active: 'نشطة',
redeemed: 'مستخدمة',
currentlyActive: 'نشطة حاليًا',
usedVouchers: 'قسائم مستخدمة',
latestStores: 'أحدث المتاجر',
recentVouchers: 'القسائم الحديثة',
topStores: 'أفضل المتاجر أداءً',
noStores: 'لا توجد متاجر بعد.',
noVouchers: 'لا توجد قسائم بعد.',
noActiveVouchers: 'لم يتم العثور على قسائم نشطة.',

  },
}

export function useLanguage() {
  const [lang, setLang] = useState<LangCode>('en')
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadLang()
  }, [])

  async function loadLang() {
    try {
      const local = localStorage.getItem('lang') as LangCode | null
      if (local) {
        applyLang(local, false)
        return
      }
      const { data } = await supabase.auth.getUser()
      const userLang = data.user?.user_metadata?.lang as LangCode | undefined
      applyLang(userLang || 'en', false)
    } catch {
      applyLang('en', false)
    }
  }

  function applyLang(code: LangCode, shouldReload = true) {
    setLang(code)
    localStorage.setItem('lang', code)
    document.documentElement.lang = code
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'

    if (shouldReload) window.location.reload() // ✅ reload page on user action
  }

  return { lang, setLang: (code: LangCode) => applyLang(code, true), t: translations[lang] }
}
