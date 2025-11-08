'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type LangCode = 'en' | 'fr' | 'ar'

const translations: Record<LangCode, Record<string, string>> = {
  en: {
    
    searchPlaceholder: 'Search by name or address...',
sort: 'Sort',
newestFirst: 'Newest first',
oldestFirst: 'Oldest first',
status: 'Status',
all: 'All',
open: 'Open',
closed: 'Closed',
wilaya: 'Wilaya',
allWilayas: 'All wilayas',
loadingStores: 'Loading stores...',
noStores: 'No stores found.',
name: 'Name',
phone: 'Phone',
address: 'Address',
actions: 'Actions',
view: 'View',
addStoreTitle: 'Add New Store',
addStoreDesc: 'Fill in the store details below.',
cancel: 'Cancel',
addStore: 'Add Store',
saving: 'Saving…',
storeName: 'Store name *',
email: 'Email *',
wilayaRange: 'Wilaya (1–58)',
unnamed: 'Unnamed',
noAddress: 'No address',
none: '—',
    settings: 'Settings',
    profile: 'Profile',
    password: 'Password',
    language: 'Language',
    roles: 'Roles',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    save: 'Save',
    confirm: 'Confirm',
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
noVouchers: 'No vouchers yet.',
noActiveVouchers: 'No active vouchers found.',
viewAll: 'View all',
searchVouchers: 'Search vouchers by code or buyer…',
loadingVouchers: 'Loading vouchers…',
noVouchersFound: 'No vouchers found.',
buyer: 'Buyer',
code: 'Code',
initial: 'Initial',
balance: 'Balance',
created: 'Created',
prev: 'Prev',
next: 'Next',
page: 'Page',
of: 'of',
createBlankVouchers: 'Create Blank Vouchers',
numberToCreate: 'Number to create',
creating: 'Creating…',
create: 'Create',
errorCreatingVouchers: 'Error creating vouchers',
vouchersCreated: 'vouchers created successfully',


  },
  fr: {
    searchVouchers: 'Rechercher un bon par code ou acheteur…',
loadingVouchers: 'Chargement des bons…',
noVouchersFound: 'Aucun bon trouvé.',
buyer: 'Acheteur',
code: 'Code',
status: 'Statut',
initial: 'Montant initial',
balance: 'Solde',
created: 'Créé le',
prev: 'Précédent',
next: 'Suivant',
page: 'Page',
of: 'sur',
createBlankVouchers: 'Créer des bons vierges',
numberToCreate: 'Nombre à créer',
creating: 'Création…',
create: 'Créer',
errorCreatingVouchers: 'Erreur lors de la création des bons',
vouchersCreated: 'bons créés avec succès',

    // 🇫🇷 French
searchPlaceholder: 'Rechercher par nom ou adresse...',
sort: 'Trier',
newestFirst: 'Plus récents',
oldestFirst: 'Plus anciens',
all: 'Tous',
open: 'Ouvert',
closed: 'Fermé',
wilaya: 'Wilaya',
allWilayas: 'Toutes les wilayas',
loadingStores: 'Chargement des magasins...',
noStores: 'Aucun magasin trouvé.',
name: 'Nom',
phone: 'Téléphone',
address: 'Adresse',
actions: 'Actions',
view: 'Voir',
addStoreTitle: 'Ajouter un magasin',
addStoreDesc: 'Remplissez les informations du magasin ci-dessous.',
cancel: 'Annuler',
addStore: 'Ajouter',
saving: 'Enregistrement…',
storeName: 'Nom du magasin *',
email: 'Email *',
wilayaRange: 'Wilaya (1–58)',
unnamed: 'Sans nom',
noAddress: 'Pas d’adresse',
none: '—',

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
noVouchers: 'Aucun bon trouvé.',
noActiveVouchers: 'Aucun bon actif trouvé.',


  },
  ar: {
    searchVouchers: 'ابحث عن قسيمة بواسطة الرمز أو اسم المشتري…',
loadingVouchers: 'جارٍ تحميل القسائم…',
noVouchersFound: 'لم يتم العثور على قسائم.',
buyer: 'المشتري',
code: 'الرمز',
status: 'الحالة',
initial: 'المبلغ الابتدائي',
balance: 'الرصيد',
created: 'تاريخ الإنشاء',
prev: 'السابق',
next: 'التالي',
page: 'صفحة',
of: 'من',
createBlankVouchers: 'إنشاء قسائم فارغة',
numberToCreate: 'عدد القسائم المراد إنشاؤها',
creating: 'جارٍ الإنشاء…',
create: 'إنشاء',
errorCreatingVouchers: 'حدث خطأ أثناء إنشاء القسائم',
vouchersCreated: 'تم إنشاء القسائم بنجاح',

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
searchPlaceholder: 'ابحث بالاسم أو العنوان...',
sort: 'ترتيب',
newestFirst: 'الأحدث أولاً',
oldestFirst: 'الأقدم أولاً',
all: 'الكل',
open: 'مفتوح',
closed: 'مغلق',
wilaya: 'الولاية',
allWilayas: 'كل الولايات',
loadingStores: 'جارٍ تحميل المتاجر...',
name: 'الاسم',
phone: 'الهاتف',
address: 'العنوان',
actions: 'إجراءات',
view: 'عرض',
addStoreTitle: 'إضافة متجر جديد',
addStoreDesc: 'املأ تفاصيل المتجر أدناه.',
addStore: 'إضافة المتجر',
saving: 'جارٍ الحفظ…',
storeName: 'اسم المتجر *',
email: 'البريد الإلكتروني *',
wilayaRange: 'الولاية (1–58)',
unnamed: 'بدون اسم',
noAddress: 'لا يوجد عنوان',
none: '—',
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
