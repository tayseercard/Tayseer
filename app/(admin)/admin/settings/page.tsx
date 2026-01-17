'use client'
import { useState, useEffect } from 'react'
import {
  User,
  Lock,
  Moon,
  Info,
  HelpCircle,
  Trash2,
  Globe2,
  Shield,
  X,
  LogOut,
  ChevronRight,
  Package,
  Coins
} from 'lucide-react'
import SettingsHeader from '@/components/admin/settings/SettingsHeader'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/useLanguage'
import ProfileSettings from '@/components/admin/settings/ProfileSettings'
import PasswordSettings from '@/components/admin/settings/PasswordSettings'
import LanguageSettings from '@/components/admin/settings/LanguageSettings'
import RolesSettings from '@/components/admin/settings/RolesSettings'
import PacksSettings from '@/components/admin/settings/PacksSettings'
import AccountingSettings from '@/components/admin/settings/AccountingSettings'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeModal, setActiveModal] = useState<
    'profile' | 'password' | 'language' | 'roles' | 'packs' | 'accounting' | null
  >(null)

  const supabase = createClientComponentClient()
  const router = useRouter()
  const { t, lang } = useLanguage()

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        window.location.href = '/auth/login?redirectTo=/admin'
      }
    })()
  }, [])

  // ✅ Refresh on language change
  useEffect(() => {
    router.refresh()
  }, [lang, router])




  async function handleLogout() {
    try {
      await supabase.auth.signOut()

      // 🧹 Clear Supabase cookies manually
      document.cookie = 'sb-access-token=; Max-Age=0; path=/;'
      document.cookie = 'sb-refresh-token=; Max-Age=0; path=/;'

      // ✅ Redirect safely to login
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div
      className={`min-h-screen bg-[var(--bg)] flex flex-col items-center transition-all duration-300 ${lang === 'ar' ? 'rtl' : 'ltr'
        }`}
    >
      {/* === HEADER === */}
      <div className="w-full max-w-6xl px-4 md:px-8 py-8">
        <SettingsHeader
          title={t.settings}
          subtitle={t.managePref}
          user={{
            name: 'Djamil',
            email: 'djamil@tayseer.dz',
            role: 'Admin',
            avatarUrl: '/icon-192-2.png',
          }}
          onLogout={handleLogout}
        />
      </div>

      {/* === CONTENT GRID === */}
      <div className="w-full max-w-6xl px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* === ACCOUNT SETTINGS === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-medium text-gray-700">
            {t.accountSettings || 'Account Settings'}
          </div>
          <div className="divide-y divide-gray-100">
            <SettingRow
              icon={<User />}
              label={t.profile}
              onClick={() => setActiveModal('profile')}
            />
            <SettingRow
              icon={<Lock />}
              label={t.password}
              onClick={() => setActiveModal('password')}
            />
            <SettingRow
              icon={<Globe2 />}
              label={t.language}
              right={
                lang === 'fr'
                  ? 'Français'
                  : lang === 'ar'
                    ? 'العربية 🇩🇿'
                    : 'English 🇬🇧'
              }
              onClick={() => setActiveModal('language')}
            />
            <SettingRow
              icon={<Shield />}
              label={t.roles}
              onClick={() => router.push("/admin/users")}
            />
          </div>
        </div>

        {/* === APP PREFERENCES === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-medium text-gray-700">
            {t.preferences || 'Preferences'}
          </div>
          <div className="divide-y divide-gray-100">

            <SettingRow
              icon={<Info />}
              label={t.aboutApp || 'About application'}
            />
            <SettingRow
              icon={<HelpCircle />}
              label={t.help || 'Help & FAQ'}
            />
            <SettingRow
              icon={<Package className="w-5 h-5" />}
              label="Offres & Packs"
              onClick={() => setActiveModal('packs')}
            />
            <SettingRow
              icon={<Coins className="w-5 h-5" />}
              label="Comptabilité"
              onClick={() => setActiveModal('accounting')}
            />
          </div>
        </div>

        {/* === LOGOUT PANEL === */}
        <div className="md:col-span-2 flex justify-center mt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-2 rounded-lg hover:bg-rose-100 border border-rose-200"
          >
            <LogOut className="w-4 h-4" /> {t.logout || 'Log out'}
          </button>
        </div>
      </div>



      {/* === MODALS === */}
      {activeModal && (
        <SettingsModal onClose={() => setActiveModal(null)}>
          {activeModal === 'profile' && <ProfileSettings t={t} />}
          {activeModal === 'password' && <PasswordSettings t={t} />}
          {activeModal === 'language' && (
            <LanguageSettings
              onLanguageChanged={() => {
                setActiveModal(null)
                router.refresh()
              }}
            />
          )}
          {activeModal === 'roles' && <RolesSettings t={t} />}
          {activeModal === 'packs' && <PacksSettings t={t} />}
          {activeModal === 'accounting' && <AccountingSettings t={t} />}
        </SettingsModal>
      )}
    </div>
  )
}

/* ------------------- Setting Row ------------------- */
function SettingRow({
  icon,
  label,
  right,
  toggle,
  toggleValue,
  onToggle,
  onClick,
  labelClass,
}: {
  icon: React.ReactNode
  label: string
  right?: string
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: () => void
  onClick?: () => void
  labelClass?: string
}) {
  return (
    <div
      onClick={!toggle ? onClick : undefined}
      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-600">{icon}</div>
        <span className={`text-sm ${labelClass ?? 'text-gray-800'}`}>
          {label}
        </span>
      </div>

      {toggle ? (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={toggleValue}
            onChange={onToggle}
          />
          <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[var(--c-accent)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
        </label>
      ) : right ? (
        <span className="text-sm text-gray-500">{right}</span>
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </div>
  )
}

export function SettingsModal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile once and on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/30 backdrop-blur-md
        animate-fade-in
      "
    >
      {/* === Backdrop click to close === */}
      <div
        onClick={onClose}
        className="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      />

      {/* === Small centered modal === */}
      <div
        className={`
          relative bg-white shadow-xl border border-gray-100
          rounded-2xl p-5 sm:p-6
          w-[90%] max-w-sm
          animate-slide-up
          ${isMobile ? 'mx-auto' : ''}
        `}
      >
        {/* === Header === */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-base sm:text-lg">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* === Content === */}
        <div className="overflow-y-auto max-h-[70vh]">{children}</div>
      </div>
    </div>
  )
}



